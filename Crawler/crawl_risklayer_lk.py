#!/usr/bin/env python
# coding: utf-8
# authors: Max Fischer & Wolfgang Jentner

import os
import re
import subprocess
import sys
import logging
from typing import Dict, Optional, List, Any

# noinspection PyUnresolvedReferences
import loadenv
from datetime import datetime, timezone, timedelta, time
from time import sleep

import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras
import requests
import numpy as np
import pandas as pd

from db_config import get_connection

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
logger.info('Crawler for Risklayer spreadsheet and case data')

conn, cur = get_connection('crawl_risklayer_lk')

#
# Parameters
#
QUERY = f'INSERT INTO cases_lk_risklayer ("date", datenbestand, ags, cases, deaths, updated_today, verified) ' \
        f'VALUES %s ON CONFLICT ON CONSTRAINT no_crawl_duplicates DO ' \
        f'UPDATE SET ' \
        f'datenbestand = EXCLUDED.datenbestand, ' \
        f'cases = EXCLUDED.cases, ' \
        f'deaths = case when EXCLUDED.deaths IS NOT NULL then EXCLUDED.deaths else cases_lk_risklayer.deaths end, ' \
        f'updated_today = EXCLUDED.updated_today;'
URL = "https://docs.google.com/spreadsheets/d/1wg-s4_Lz2Stil6spQEYFdZaBEp8nWW26gVyfHqvcl8s/export?format=xlsx"
# URL = "https://docs.google.com/spreadsheets/d/10HiCpVWvD-WMvxUS33ItJg5V-WUHmjPMZzHHJnuFgPc/export?format=xlsx"
STORAGE_PATH = "/var/risklayer_spreadsheets/"
NUM_RETRIES = 5
WAIT_MS_RETRY = 5000
BACKOFF_BASE_TIME = 10  # sec


def parse_cookies() -> Dict[str, str]:
    """Parse a cookies.txt file and return a dictionary of key value pairs
    compatible with requests."""

    cookies = {}
    if os.environ.get('GOOGLE_COOKIES') is not None:
        for line in os.environ.get('GOOGLE_COOKIES').splitlines():
            if not re.match(r'^#', line):
                line_fields = line.strip().split('\t')
                cookies[line_fields[5]] = line_fields[6]
    else:
        with open('./google.com_cookies.txt', 'r') as fp:
            for line in fp:
                if not re.match(r'^#', line):
                    line_fields = line.strip().split('\t')
                    cookies[line_fields[5]] = line_fields[6]
    return cookies


def download_file(fp: str) -> bool:
    req = requests.get(URL, allow_redirects=True, cookies=parse_cookies())
    with open(fp, 'wb') as file:
        file.write(req.content)
        file.close()
        logger.info(f'Downloaded file.')
        failed = False
        if req.text.find('nicht verfügbar zu sein') > 0:
            logger.error('heuristics said: rate limit')
            failed = True
        elif req.text.find('Zur Nutzung von') > 0:
            logger.error('heuristics said: spreadsheet not public. login required')
            failed = True
        elif req.text.find('Datei kann derzeit nicht') > 0:
            logger.error('heuristics said: rate limit')
            failed = True
        elif req.text.find('<html') > 0:
            logger.error('this is a html document')
            failed = True

        if failed:
            logger.info('renaming file to html for further debugging')
            os.rename(fp, fp[0:-4] + "html")
            return False

        return True


def parse_file(fp: str) -> Optional[pd.DataFrame]:
    try:
        logger.info('Parse data')
        df = pd.read_excel(fp, sheet_name=['Überblick', 'Haupt', 'Kreise'], header=None,
                           na_filter=False, engine="openpyxl")
        return df
    except Exception as e:
        logger.warning(f'Failed parsing spreadsheet')
        logger.warning(str(e))
        return None


def get_prognosis(df: pd.DataFrame) -> float:
    return df['Überblick'].iloc[18, 6]


def get_county_data(df_data: pd.DataFrame) -> (List[Dict[str, Any]], int):
    df = df_data['Haupt'].iloc[5:406, [2, 0, 0, 10, 3, 47, 48, 49, 15, 39, 23]]
    # AGS, Name, Name (->update-status) Today, -1d, -2d, -3d, -4d, death today, death -1d, verified (0|1)
    df[2] = df[2].astype(int)  # calls cannot be chained
    df[2] = df[2].astype(str)
    df[2] = df[2].apply(lambda x: x.zfill(5))

    # remove Eisenach from Haupt data as it is now included into Wartburgkreis
    df = df[df[10] != '']

    db_array = df.to_numpy()

    # get update status via hack (because RK calc is complex)
    dfhelp = df_data['Kreise'].iloc[3:, [0, 2, 8]]
    dfhelp[0] = dfhelp[0] - 1
    dfhelp[8] = dfhelp[8].apply(lambda x: x != '')
    db_help_array = dfhelp.to_numpy()
    db_help_array = db_help_array[db_help_array[:, 0].argsort()]  # sort like the main table

    intersected = np.intersect1d(db_help_array[:, 1], db_array[:, 1])

    # check if alignment fits
    equal_positions = len(intersected)
    if equal_positions >= 357:
        pass  # perfect, we expect that based on incorrect RK naming
    elif equal_positions >= 320:
        logger.warning(
            f"Aligning update status resulted in {equal_positions} matches, which is likely fine (we expect 357).")
    else:
        logger.error(
            f"Aligning RK update status failed with {equal_positions} < 320 matches. RK might have changed their "
            f"format again!")
        exit(1)

    # copy updated status in the correct ordering
    db_array[:, 2] = db_help_array[:, 2]

    # reformat
    updated_today_count = 0
    time_23_59 = time(21, 59)
    date_arr = [{'datenbestand': current_update, 'row_id_cases': 3, 'row_id_deaths': 8},
                {'datenbestand': datetime.combine(current_update.date() - timedelta(days=1), time_23_59).replace(
                    tzinfo=timezone.utc), 'row_id_cases': 4, 'row_id_deaths': 9},
                {'datenbestand': datetime.combine(current_update.date() - timedelta(days=2), time_23_59).replace(
                    tzinfo=timezone.utc), 'row_id_cases': 5, 'row_id_deaths': None},
                {'datenbestand': datetime.combine(current_update.date() - timedelta(days=3), time_23_59).replace(
                    tzinfo=timezone.utc), 'row_id_cases': 6, 'row_id_deaths': None},
                {'datenbestand': datetime.combine(current_update.date() - timedelta(days=4), time_23_59).replace(
                    tzinfo=timezone.utc), 'row_id_cases': 7, 'row_id_deaths': None},
                # {'datenbestand': datetime.combine(current_update.date() - timedelta(days=5), time_23_59).replace(
                # tzinfo=timezone.utc), 'row_id_cases': 9, 'row_id_deaths': None},
                # {'datenbestand': datetime.combine(current_update.date() - timedelta(days=6), time_23_59).replace(
                # tzinfo=timezone.utc), 'row_id_cases': 12, 'row_id_deaths': None},
                # {'datenbestand': datetime.combine(current_update.date() - timedelta(days=7), time_23_59).replace(
                # tzinfo=timezone.utc), 'row_id_cases': 13, 'row_id_deaths': None},
                # {'datenbestand': datetime.combine(current_update.date() - timedelta(days=8), time_23_59).replace(
                # tzinfo=timezone.utc), 'row_id_cases': 14, 'row_id_deaths': None},
                # {'datenbestand': datetime.combine(current_update.date() - timedelta(days=9), time_23_59).replace(
                # tzinfo=timezone.utc), 'row_id_cases': 15, 'row_id_deaths': None},
                # {'datenbestand': datetime.combine(current_update.date() - timedelta(days=10), time_23_59).replace(
                # tzinfo=timezone.utc), 'row_id_cases': 16, 'row_id_deaths': None},
                # {'datenbestand': datetime.combine(current_update.date() - timedelta(days=11), time_23_59).replace(
                # tzinfo=timezone.utc), 'row_id_cases': 17, 'row_id_deaths': None},
                # {'datenbestand': datetime.combine(current_update.date() - timedelta(days=12), time_23_59).replace(
                # tzinfo=timezone.utc), 'row_id_cases': 18, 'row_id_deaths': None},
                # {'datenbestand': datetime.combine(current_update.date() - timedelta(days=13), time_23_59).replace(
                # tzinfo=timezone.utc), 'row_id_cases': 19, 'row_id_deaths': None}
                ]
    data_entries: List[Dict[str, Any]] = []
    for row in db_array:
        for history in date_arr:
            entry = {
                'datenbestand': history['datenbestand'],
                'ags': row[0],
                'cases': row[history['row_id_cases']],
                'deaths': row[history['row_id_deaths']] if history['row_id_deaths'] is not None else None,
                'updated_today': row[2] or (history['datenbestand'] != current_update),
                'verified': row[10] == 1
            }

            # pandas 1.3+ changes the parsing behaviour, we now sometimes get floats back, even the value should be int
            # to mitigate, we explicitly cast back to int
            for name in ['cases', 'deaths']:
                if isinstance(entry[name], float):
                    entry[name] = int(entry[name])

            if (history['datenbestand'] == current_update) and row[2]:
                updated_today_count += 1
            if (isinstance(entry['cases'], int) or entry['cases'] is None) and (
                    isinstance(entry['deaths'], int) or entry['deaths'] is None):
                data_entries.append(entry)
            else:
                logger.warning(f"Could not parse cases or deaths of {entry} correctly. Will omit this entry.")
    return data_entries, updated_today_count


def insert_into_db(prognosis_today: float, data_entries: List[Dict[str, Any]], updated_today_count: int):
    try:
        cur.execute(f"Select Max(datenbestand) from cases_lk_risklayer_current")
        last_update = cur.fetchone()[0]

        cur.execute(f"SELECT COUNT(*) FROM cases_lk_risklayer_current WHERE updated_today = True")
        num_cases_updated_today = cur.fetchone()[0]

        logger.info(f"db data version: {last_update}")
        logger.info(f"fetched data version: {current_update}")
        logger.info(f"Number of LK publications for today in DB: {num_cases_updated_today}")
        logger.info(
            f"Number of LK publications for today in this update: "
            f"{updated_today_count} (change: {updated_today_count - num_cases_updated_today})"
        )
        logger.info(f"Prognosis number of cases for today: {prognosis_today}")

        if last_update is not None and abs((current_update - last_update).total_seconds()) <= 5:
            logger.info("Apply throttling (+/- 5min) and skip update")
            exit(0)
        else:
            logger.info('Insert new data into DB (takes 2-5 seconds)...')

            psycopg2.extras.execute_values(
                cur, QUERY, data_entries,
                template='(%(datenbestand)s::date, %(datenbestand)s, %(ags)s, %(cases)s, %(deaths)s, '
                         '%(updated_today)s, %(verified)s)',
                page_size=500
            )
            conn.commit()
            logger.info('Data inserted.')

            cur.execute("INSERT INTO risklayer_prognosis (datenbestand, prognosis) VALUES(%s, %s)",
                        (current_update, prognosis_today))
            conn.commit()
            logger.info('Prognosis data inserted.')

            logger.info('Refreshing materialized view')
            cur.execute('set time zone \'UTC\'; REFRESH MATERIALIZED VIEW CONCURRENTLY cases_per_county_and_day_risklayer;')
            conn.commit()

            logger.info('Send notification emails')

            notification_result = requests.post('https://api.coronavis.dbvis.de/sub/send-notifications',
                                                headers={'X-API-KEY': os.getenv('API_KEY')})
            # notification_result = requests.post('http://localhost:5000/sub/send-notifications',
            #                                     headers={'X-API-KEY': os.getenv('API_KEY')})
            logger.info(notification_result.text)

            print(subprocess.run(['fdupes', '-dN', '-o', 'name', STORAGE_PATH], capture_output=True))

            logger.info('Success')

            if conn:
                cur.close()
                conn.close()

            exit(0)
    except (Exception, pg.DatabaseError) as error:
        logger.error(error)
        logger.error("Error in transaction - Reverting all other operations of a transaction")
        logger.error("Most likely a simultaneous update was applied faster.")

        conn.rollback()

        if conn:
            cur.close()
            conn.close()

        exit(1)


if os.name == 'nt':  # debug only
    STORAGE_PATH = './'
if not os.path.isdir(STORAGE_PATH):
    logger.error(f"Storage path {STORAGE_PATH} does not appear to be a valid directory")
    exit(1)

cur_try = 1
max_tries = 5
while cur_try <= max_tries:
    current_update = datetime.now(timezone.utc)
    logger.debug(f'Fetch risklayer spreadsheet at {current_update.strftime("%Y-%m-%dT%H:%M:%S.%f%Z")}')
    filepath = STORAGE_PATH + current_update.strftime("%Y-%m-%dT%H-%M-%S") + '.xlsx'

    if not download_file(filepath):
        logger.error('download failed')
        sleep(cur_try * 10)
        continue

    data = parse_file(filepath)
    if data is None:
        logger.error('parsing failed')
        sleep(cur_try * 10)
        continue

    entries, update_count = get_county_data(data)
    prognosis = get_prognosis(data)
    insert_into_db(prognosis, entries, update_count)

    cur_try += 1

if cur_try >= max_tries:
    logger.error('could not download and parse spreadsheet')
    exit(1)
