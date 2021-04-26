#!/usr/bin/env python
# coding: utf-8
# author: Wolfgang Jentner
import os
import sys
import datetime
import logging
from datetime import  datetime, timezone

import pandas as pd
import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras
import requests

import loadenv

from db_config import SQLALCHEMY_DATABASE_URI

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

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


def parse_and_insert(fp: str) -> bool:
    df = pd.read_excel(fp, sheet_name=['LK_7-Tage-Inzidenz'], header=None,
                       na_filter=False, engine="openpyxl")

    stand = df['LK_7-Tage-Inzidenz'].iloc[1, 0]

    datenbestand = datetime.strptime(stand, 'Stand: %d.%m.%Y %H:%M:%S')

    data = df['LK_7-Tage-Inzidenz'].iloc[4:416]
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
        """INSERT INTO 
            rki_incidence_excel (datenbestand, ags, timestamp, \"7_day_incidence\") 
            VALUES %s ON CONFLICT ON CONSTRAINT rki_incidence_excel_pk DO
            UPDATE SET
                \"7_day_incidence\" = EXCLUDED.\"7_day_incidence\",
                updated_at = NOW();
        """,
        entries,
        template='(%(datenbestand)s, %(id)s, %(ts)s, %(val)s)',
        page_size=500
    )
    conn.commit()

    return True


conn, cur = get_connection()


def process_county_ebrake(county_id) -> None:
    cur.execute(f"""
        SELECT timestamp, \"7_day_incidence\" 
        FROM rki_incidence_excel 
        WHERE ags = '{county_id}'
        AND datenbestand = (SELECT MAX(datenbestand) FROM rki_incidence_excel)
        AND timestamp >= '2021-04-20' ORDER BY timestamp""")
    c_data = cur.fetchall()

    # delete existing ebrake data
    cur.execute(f"DELETE FROM counties_ebrake WHERE id = '{county_id}'")

    ret_data = []
    for d in c_data:
        ret_data.append({
            'id': county_id,
            'ts': d[0],
            'val': round(d[1]),
            'over100': False,
            'over165': False
        })

    in_e_brake100 = False
    in_e_brake165 = False
    for i in range(4, len(ret_data)):

        # check for date idx = i if ebrake has started
        # must be over t for 3 days
        ret_data[i]['over100'] = True
        ret_data[i]['over165'] = True
        for j in range(i - 4, i - 1):
            if c_data[j][1] < 165:
                ret_data[i]['over165'] = False

            if c_data[j][1] < 100:
                ret_data[i]['over100'] = False
                break

        if ret_data[i]['over100'] is True:
            in_e_brake100 = True

        if ret_data[i]['over165'] is True:
            in_e_brake165 = True

        # date is still in eBrake
        if in_e_brake100 is True:
            ret_data[i]['over100'] = True

        if in_e_brake165 is True:
            ret_data[i]['over165'] = True

        # ebrake can only be terminated on a sunday
        if ret_data[i]['ts'].isoweekday() == 7:
            over100 = False
            over165 = False
            for j in range(max(0, i - 6), i - 1):
                if ret_data[j]['val'] >= 100:
                    over100 = True

                if ret_data[j]['val'] >= 165:
                    over165 = True
                    break

            if over165 is False:
                ret_data[i]['over165'] = False
                in_e_brake165 = False

            if over100 is False:
                ret_data[i]['over100'] = False
                in_e_brake100 = False

    # write to DB:
    psycopg2.extras.execute_values(
        cur,
        "INSERT INTO counties_ebrake (id, timestamp, ebrake100, ebrake165) VALUES %s",
        ret_data,
        template='(%(id)s, %(ts)s, %(over100)s, %(over165)s)',
        page_size=500
    )
    conn.commit()
    return None


try:
    STORAGE_PATH = "/var/rki_incidences/"
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
    cur.execute('REFRESH MATERIALIZED VIEW cases_per_county_and_day')
    conn.commit()

    logger.info('Success')

except Exception as err:
    logger.error(err)

    if (conn):
        conn.rollback()
        cur.close()
        conn.close()

    exit(1)
