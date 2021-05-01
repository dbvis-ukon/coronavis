#!/usr/bin/env python
# coding: utf-8
# author: Wolfgang Jentner
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
    conn = pg.connect(SQLALCHEMY_DATABASE_URI)
    conn.set_session(autocommit=False, isolation_level=psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE)
    cur = conn.cursor()
    return conn, cur


def parse_and_insert_sheet(df, sheet_name, col_name):
    logger.info(f"Parse sheet {sheet_name}")

    stand = df[sheet_name].iloc[1, 0]

    datenbestand = datetime.strptime(stand, 'Stand: %d.%m.%Y %H:%M:%S')

    data = df[sheet_name].iloc[4:417]
    col = 0
    for d in data.loc[data.index[0]]:
        if isinstance(d, str):
            try:
                parsed = datetime.strptime(d, '%d.%m.%Y')

                data.iat[0, col] = parsed
            except:
                pass

        col += 1

    # data[2] = data[2].apply(lambda x: "{:05d}".format(x) if isinstance(x, int) else x)

    entries = []
    for r_idx in range(1, data.shape[0]):
        for c_idx in range(3, data.shape[1]):
            val = None if data.iloc[r_idx, c_idx] == '' else data.iloc[r_idx, c_idx]
            entry = {
                'datenbestand': datenbestand,
                'id': "{:05d}".format(data.iloc[r_idx, 2]),
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
    df = pd.read_excel(fp, sheet_name=['LK_7-Tage-Inzidenz', 'LK_7-Tage-Fallzahlen'], header=None,
                       na_filter=False, engine="openpyxl")

    parse_and_insert_sheet(df=df, sheet_name='LK_7-Tage-Inzidenz', col_name='7_day_incidence')
    parse_and_insert_sheet(df=df, sheet_name='LK_7-Tage-Fallzahlen', col_name='7_day_cases')

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
            'over100': False,
            'over165': False
        })

    # nowcast
    today = datetime.combine(datetime.today(), datetime.min.time())
    if ret_data[-1]['ts'] < today:
        ret_data.append({
            'id': county_id,
            'ts': today,
            'val': None,
            'over100': None,
            'over165': None
        })

    # forecast
    for i in range(1, 8):
        future_dt = today + timedelta(days=i)
        ret_data.append({
            'id': county_id,
            'ts': future_dt,
            'val': None,
            'over100': None,
            'over165': None
        })

    in_e_brake100 = None
    in_e_brake165 = None
    for i in range(4, len(ret_data)):

        # check for date idx = i if ebrake has started
        # must be over t for 3 days
        ret_data[i]['over100'] = True
        ret_data[i]['over165'] = True
        skipped = False
        for j in range(i - 4, i - 1):
            if ret_data[j]['val'] is None:
                skipped = True
                continue

            if ret_data[j]['val'] < 165:
                ret_data[i]['over165'] = False

            if ret_data[j]['val'] < 100:
                ret_data[i]['over100'] = False
                break

        if skipped is True:
            ret_data[i]['over100'] = None
            ret_data[i]['over165'] = None

        if ret_data[i]['over100'] is True:
            in_e_brake100 = True

        if ret_data[i]['over165'] is True:
            in_e_brake165 = True

        # date is still in eBrake
        if in_e_brake100 is True:
            ret_data[i]['over100'] = True

        if in_e_brake165 is True:
            ret_data[i]['over165'] = True

        # only necessary if currently in ebrake
        if in_e_brake100 is True or in_e_brake165 is True:
            over100 = None
            over165 = None
            num_weekdays = 0
            # start with -2 because it only concerns the day after tomorrow
            j = i - 2
            # go back in time until 5 weekdays are processed or beginning of data is reached
            while j >= 0 and num_weekdays < 5:
                # sunday and holidays are skipped
                if ret_data[j]['ts'].isoweekday() == 7 \
                        or ret_data[j]['ts'] in state_holidays:
                    j -= 1
                    continue

                # in case incidence is not available because of future predictions
                if ret_data[j]['val'] is None:
                    j -= 1
                    # still count this as a weekday
                    num_weekdays += 1
                    continue

                if ret_data[j]['val'] >= 100:
                    over100 = True
                elif over100 is None:
                    over100 = False

                if ret_data[j]['val'] >= 165:
                    over165 = True
                elif over165 is None:
                    over165 = False

                num_weekdays += 1
                j -= 1

            if over165 is False:
                ret_data[i]['over165'] = False
                in_e_brake165 = False
            elif over165 is None:
                ret_data[i]['over165'] = None
                in_e_brake165 = None

            if over100 is False:
                ret_data[i]['over100'] = False
                in_e_brake100 = False
            elif over100 is None:
                ret_data[i]['over100'] = None
                in_e_brake100 = None

    # write to DB:
    psycopg2.extras.execute_values(
        cur,
        "INSERT INTO counties_ebrake (id, timestamp, ebrake100, ebrake165) VALUES %s",
        ret_data,
        template='(%(id)s, %(ts)s, %(over100)s, %(over165)s)',
        page_size=500
    )
    conn.commit()


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
    cur.execute("SELECT ags FROM rki_incidence_excel GROUP BY ags")
    county_ids = cur.fetchall()

    for c in county_ids:
        process_county_ebrake(c[0])

    logger.info('Refreshing materialized view.')
    cur.execute("SET TIME ZONE 'UTC'; REFRESH MATERIALIZED VIEW cases_per_county_and_day;")
    conn.commit()

    logger.info('Success')

except Exception as err:
    logger.error(err)
    traceback.print_exc()

    if (conn):
        conn.rollback()
        cur.close()
        conn.close()

    exit(1)
