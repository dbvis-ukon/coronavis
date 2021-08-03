#!/usr/bin/env python
# coding: utf-8
# author: Wolfgang Jentner
import math
import os
import sys
import datetime
import logging
import traceback
from datetime import datetime, timezone, timedelta

import holidays
import pandas as pd
import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras
import requests

# noinspection PyUnresolvedReferences
import loadenv

from db_config import SQLALCHEMY_DATABASE_URI

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

# https://de.wikipedia.org/wiki/Amtlicher_Gemeindeschl%C3%BCssel
# 01	Schleswig-Holstein
# 02	Freie und Hansestadt Hamburg
# 03	Niedersachsen
# 04	Freie Hansestadt Bremen
# 05	Nordrhein-Westfalen
# 06	Hessen
# 07	Rheinland-Pfalz
# 08	Baden-Württemberg
# 09	Freistaat Bayern
# 10	Saarland
# 11	Berlin
# 12	Brandenburg
# 13	Mecklenburg-Vorpommern
# 14	Freistaat Sachsen
# 15	Sachsen-Anhalt
# 16	Freistaat Thüringen
# holidays: BW, BY, BYP, BE, BB, HB, HH, HE, MV, NI, NW, RP, SL, SN, ST, SH, TH
# refers to ISO code: https://en.wikipedia.org/wiki/States_of_Germany
AGS_TO_ISO = {
    '01': 'SH',
    '02': 'HH',
    '03': 'NI',
    '04': 'HB',
    '05': 'NW',
    '06': 'HE',
    '07': 'RP',
    '08': 'BW',
    '09': 'BY',
    '10': 'SL',
    '11': 'BE',
    '12': 'BB',
    '13': 'MV',
    '14': 'SN',
    '15': 'ST',
    '16': 'TH'
}

URL = 'https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Daten/Fallzahlen_Kum_Tab.xlsx?__blob=publicationFile'

logger.info('Crawler for RKI incidences excel sheet')


def download_file(fp: str) -> bool:
    req = requests.get(URL, allow_redirects=True)
    with open(fp, 'wb') as file:
        file.write(req.content)
        file.close()
        logger.info(f'Downloaded file.')
        return True


def get_connection():
    _conn = pg.connect(SQLALCHEMY_DATABASE_URI)
    _conn.set_session(autocommit=False, isolation_level=psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE)
    _cur = _conn.cursor()
    return _conn, _cur


def parse_and_insert_sheet(df, sheet_name, col_name):
    logger.info(f"Parse sheet {sheet_name}")

    stand = df[sheet_name].iloc[1, 0]

    datenbestand = datetime.strptime(stand, 'Stand: %d.%m.%Y %H:%M:%S')

    nan_value = float("NaN")
    data = df[sheet_name].iloc[4:, 2:].replace("", nan_value).dropna(how='all', axis=1)

    col = 0
    for d in data.loc[data.index[0]]:
        if isinstance(d, str):
            try:
                parsed = datetime.strptime(d, '%d.%m.%Y')

                data.iat[0, col] = parsed
            except ValueError as _:
                pass

        col += 1

    # data[2] = data[2].apply(lambda x: "{:05d}".format(x) if isinstance(x, int) else x)

    entries = []
    for r_idx in range(1, data.shape[0]):
        lknr = data.iloc[r_idx, 0]
        if lknr is nan_value or lknr is None:
            continue
        lknr_formatted = "{:05d}".format(lknr)
        for c_idx in range(1, data.shape[1]):
            val = None if data.iloc[r_idx, c_idx] == '' or math.isnan(data.iloc[r_idx, c_idx]) else data.iloc[r_idx, c_idx]
            entry = {
                'datenbestand': datenbestand,
                'id': lknr_formatted,
                'ts': data.iloc[0, c_idx],
                'val': val
            }
            entries.append(entry)

    psycopg2.extras.execute_values(
        cur,
        f"""INSERT INTO 
            rki_incidence_excel (datenbestand, ags, timestamp, \"{col_name}\") 
            VALUES %s ON CONFLICT ON CONSTRAINT rki_incidence_excel_pk DO
            UPDATE SET
                \"{col_name}\" = EXCLUDED.\"{col_name}\",
                updated_at = NOW();
        """,
        entries,
        template='(%(datenbestand)s, %(id)s, %(ts)s, %(val)s)',
        page_size=500
    )
    conn.commit()

    return True


def parse_and_insert(fp: str) -> bool:
    df = pd.read_excel(fp, sheet_name=['LK_7-Tage-Inzidenz (fixiert)', 'LK_7-Tage-Fallzahlen (fixiert)'], header=None,
                       na_filter=False, engine="openpyxl")

    parse_and_insert_sheet(df=df, sheet_name='LK_7-Tage-Inzidenz (fixiert)', col_name='7_day_incidence')
    parse_and_insert_sheet(df=df, sheet_name='LK_7-Tage-Fallzahlen (fixiert)', col_name='7_day_cases')

    return True


def process_county_ebrake(county_id) -> None:
    cur.execute(f"""
        SELECT timestamp, \"7_day_incidence\" 
        FROM rki_incidence_excel_berlin 
        WHERE ags = '{county_id}'
        AND datenbestand = (SELECT MAX(datenbestand) FROM rki_incidence_excel)
        AND timestamp >= '2021-04-20' ORDER BY timestamp""")
    c_data = cur.fetchall()

    # delete existing ebrake data
    cur.execute(f"DELETE FROM counties_ebrake WHERE id = '{county_id}'")

    # get holidays for the state of the county:
    state_holidays = holidays.Germany(prov=AGS_TO_ISO[county_id[0:2]])

    ret_data = []
    for d in c_data:
        ret_data.append({
            'id': county_id,
            'ts': d[0],
            'val': round(d[1], 2),
            'ebrake100': False,
            'ebrake150': False,
            'ebrake165': False,
            'holiday': state_holidays.get(d[0])
        })

    # nowcast
    today = datetime.combine(datetime.today(), datetime.min.time())
    if ret_data[-1]['ts'] < today:
        ret_data.append({
            'id': county_id,
            'ts': today,
            'val': None,
            'ebrake100': False,
            'ebrake150': False,
            'ebrake165': False,
            'holiday': state_holidays.get(today)
        })

    # forecast
    for i in range(1, 8):
        future_dt = today + timedelta(days=i)
        ret_data.append({
            'id': county_id,
            'ts': future_dt,
            'val': None,
            'ebrake100': False,
            'ebrake150': False,
            'ebrake165': False,
            'holiday': state_holidays.get(future_dt)
        })

    # contains the idx when ebrake has started for respective threshold
    ebrake_start = {100: None, 150: None, 165: None}
    for i in range(4, len(ret_data)):

        # check for date idx = i if ebrake has started
        # must be over t for 3 days
        ret_data[i]['ebrake100'] = True
        ret_data[i]['ebrake150'] = True
        ret_data[i]['ebrake165'] = True
        skipped = False
        for j in range(i - 4, i - 1):
            if ret_data[j]['val'] is None:
                skipped = True
                continue

            if ret_data[j]['val'] < 165:
                ret_data[i]['ebrake165'] = False

            if ret_data[j]['val'] < 150:
                ret_data[i]['ebrake150'] = False

            if ret_data[j]['val'] < 100:
                ret_data[i]['ebrake100'] = False
                break

        if skipped is True:
            ret_data[i]['ebrake100'] = None
            ret_data[i]['ebrake150'] = None
            ret_data[i]['ebrake165'] = None

        if ret_data[i]['ebrake100'] is True and ebrake_start[100] is None:
            ebrake_start[100] = i

        if ret_data[i]['ebrake150'] is True and ebrake_start[150] is None:
            ebrake_start[150] = i

        if ret_data[i]['ebrake165'] is True and ebrake_start[165] is None:
            ebrake_start[165] = i

        # date is still in eBrake
        if ebrake_start[100] is not None:
            ret_data[i]['ebrake100'] = True

        if ebrake_start[150] is not None:
            ret_data[i]['ebrake150'] = True

        if ebrake_start[165] is not None:
            ret_data[i]['ebrake165'] = True

        # only necessary if currently in ebrake
        if ebrake_start[100] is not None:
            over100 = None
            over150 = None
            over165 = None
            num_weekdays = 0
            # start with -2 because it only concerns the day after tomorrow
            j = i - 2
            # go back in time until 5 weekdays are processed or beginning of data is reached
            while j >= 0 and num_weekdays < 5:
                # sunday and holidays are skipped
                if ret_data[j]['ts'].isoweekday() == 7 \
                        or ret_data[j]['holiday'] is not None:
                    j -= 1
                    continue

                # in case incidence is not available because of future predictions
                if ret_data[j]['val'] is None:
                    j -= 1
                    # still count this as a weekday
                    num_weekdays += 1
                    continue

                if ebrake_start[100] is not None and (ret_data[j]['val'] >= 100 or j < (ebrake_start[100] + 1)):
                    over100 = True
                elif over100 is None:
                    over100 = False

                if ebrake_start[150] is not None and (ret_data[j]['val'] >= 150 or j < (ebrake_start[150] + 1)):
                    over150 = True
                elif over150 is None:
                    over150 = False

                if ebrake_start[165] is not None and (ret_data[j]['val'] >= 165 or j < (ebrake_start[165] + 1)):
                    over165 = True
                    break
                elif over165 is None:
                    over165 = False

                num_weekdays += 1
                j -= 1

            if over165 is False:
                ret_data[i]['ebrake165'] = False
                ebrake_start[165] = None
            elif over165 is None:
                ret_data[i]['ebrake165'] = None
                ebrake_start[165] = None

            if over150 is False:
                ret_data[i]['ebrake150'] = False
                ebrake_start[150] = None
            elif over150 is None:
                ret_data[i]['ebrake150'] = None
                ebrake_start[150] = None

            if over100 is False:
                ret_data[i]['ebrake100'] = False
                ebrake_start[100] = None
            elif over100 is None:
                ret_data[i]['ebrake100'] = None
                ebrake_start[100] = None

    # write to DB:
    psycopg2.extras.execute_values(
        cur,
        "INSERT INTO counties_ebrake (id, timestamp, ebrake100, ebrake150, ebrake165, holiday) VALUES %s",
        ret_data,
        template='(%(id)s, %(ts)s, %(ebrake100)s, %(ebrake150)s, %(ebrake165)s, %(holiday)s)',
        page_size=500
    )
    conn.commit()
    return None

conn = None
cur = None
try:
    conn, cur = get_connection()

    STORAGE_PATH = "/data/"
    if os.name == 'nt':  # debug only
        STORAGE_PATH = './'
    if not os.path.isdir(STORAGE_PATH):
        logger.error(f"Storage path {STORAGE_PATH} does not appear to be a valid directory")
        exit(1)

    current_update = datetime.now(timezone.utc)
    filepath = STORAGE_PATH + current_update.strftime("%Y-%m-%dT%H-%M-%S") + '.xlsx'

    if not download_file(filepath):
        logger.error('failed download')
        exit(1)

    if not parse_and_insert(filepath):
        logger.error('failed parsing or inserting')
        exit(1)

    logger.info('Calculate and inject ebrake data')
    # inject ebrake data
    cur.execute("SELECT ags FROM rki_incidence_excel_berlin_current GROUP BY ags")
    county_ids = cur.fetchall()

    for c in county_ids:
        process_county_ebrake(c[0])

    logger.info('Refreshing materialized view cases_per_county_and_day.')
    cur.execute("SET TIME ZONE 'UTC'; REFRESH MATERIALIZED VIEW cases_per_county_and_day;")
    conn.commit()

    logger.info('Refreshing materialized view ebrake_data.')
    cur.execute("SET TIME ZONE 'UTC'; REFRESH MATERIALIZED VIEW ebrake_data;")
    conn.commit()

    logger.info('Success')

except Exception as err:
    logger.error(err)
    traceback.print_exc()

    if conn:
        conn.rollback()
        cur.close()
        conn.close()

    exit(1)
