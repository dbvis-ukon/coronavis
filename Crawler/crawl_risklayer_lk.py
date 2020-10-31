#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer

import os
import logging
import loadenv
from datetime import datetime, timezone, timedelta, time
from time import sleep

import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras
import requests
import pandas as pd

from db_config import SQLALCHEMY_DATABASE_URI
#logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

logger = logging.getLogger(__name__)
logger.info('Crawler for Risklayer spreadsheet and case data')

#
# Parameters
#
DB_TABLE = 'cases_lk_risklayer'
DB_TABLE_CURRENT = 'cases_lk_risklayer_current'
QUERY = f'INSERT INTO {DB_TABLE} (datenbestand, ags, cases, deaths, updated_today) VALUES %s ON CONFLICT ON CONSTRAINT no_crawl_dublicates DO UPDATE SET cases = EXCLUDED.cases, deaths = case when EXCLUDED.deaths IS NOT NULL then EXCLUDED.deaths else {DB_TABLE}.deaths end;'
URL = "https://docs.google.com/spreadsheets/d/1wg-s4_Lz2Stil6spQEYFdZaBEp8nWW26gVyfHqvcl8s/export?format=xlsx"
STORAGE_PATH = "/var/risklayer_spreadsheets/"
NUM_RETRIES = 5
WAIT_MS_RETRY = 5000
BACKOFF_BASE_TIME = 10 # sec

#
# DB help
#
def get_connection():
    conn = pg.connect(SQLALCHEMY_DATABASE_URI)
    conn.set_session(autocommit=False, isolation_level=psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE)
    cur = conn.cursor()
    return conn, cur
#
# Fetching data
#
data = None
current_update = datetime.now(timezone.utc)
logger.debug(f'Fetch risklayer spreadsheet at {current_update.strftime("%Y-%m-%dT%H:%M:%S.%f%Z")}')
current_try = 1
filepath = ''
delay_s = BACKOFF_BASE_TIME
while current_try <= NUM_RETRIES:
    try:
        r = requests.get(URL, allow_redirects=True)
        if os.name == 'nt': # debug only
            STORAGE_PATH = './'
        if not os.path.isdir(STORAGE_PATH):
            logger.error(f"Storage path {STORAGE_PATH} does not appear to be a valid directory")
            exit(1)
        filepath = STORAGE_PATH + current_update.strftime("%Y-%m-%dT%H-%M-%S") + '.xlsx'
        with open(filepath, 'wb') as f:
            f.write(r.content)
            logger.info(f'Download succeeded.')
            try:
                #
                # parsing
                #
                logger.info('Parse data')
                data = pd.read_excel(filepath, sheet_name=None, header=None, na_filter=False)
                break
            except:
                logger.warning(f'Failed parsing spreadsheet {current_try}/{NUM_RETRIES}, dowloading again...')
                logger.info(f'Removing file from archive...')
                os.remove(filepath)
                logger.info(f'Backoff delay for {delay_s} sec...')
                sleep(delay_s)
    except:
        logger.warning(f'Failed download spreadsheet try {current_try}/{NUM_RETRIES}, retrying...')
    finally:
        current_try += 1
        delay_s = 2 * delay_s
if current_try > NUM_RETRIES or data is None:
    logger.error(f"Number of retries ({NUM_RETRIES}) has been exceeded.")
    exit(1)


logger.info('Extract data')
prognosis_today = data['Statistik Überblick'].iloc[17,6]
df = data['Kreise'].iloc[3:,[1,2,13,8, 10, 25, 26, 27, 28, 29, 41, 42, 30, 31, 32, 33,34, 35, 36, 37]]
df[1] = df[1].astype(str)
df[1] = df[1].apply(lambda x: x.zfill(5))
df[8] = df[8].apply(lambda x: x != '' )
db_array = df.to_numpy()

# reformat
entries = []
updated_today_count = 0
time_23_59 = time(21, 59)
date_arr = [ {'datenbestand':  current_update, 'row_id_cases': 4, 'row_id_deaths': 2},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=1), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 5, 'row_id_deaths': 10},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=2), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 6, 'row_id_deaths': 11},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=3), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 7, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=4), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 8, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=5), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 9, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=6), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 12, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=7), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 13, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=8), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 14, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=9), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 15, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=10), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 16, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=11), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 17, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=12), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 18, 'row_id_deaths': None},
             {'datenbestand':  datetime.combine(current_update.date() - timedelta(days=13), time_23_59).replace(tzinfo=timezone.utc), 'row_id_cases': 19, 'row_id_deaths': None}]             

for row in db_array:
    for history in date_arr:
        entry = {
            'datenbestand': history['datenbestand'],
            'ags': row[0],
            'cases': row[history['row_id_cases']],
            'deaths': row[history['row_id_deaths']] if history['row_id_deaths'] is not None else None,
            'updated_today': row[3] or (history['datenbestand'] != current_update)
        }
        if (history['datenbestand'] == current_update) and row[4]:
            updated_today_count += 1
        entries.append(entry)

try:  
    conn, cur = get_connection()

    cur.execute(f"Select Max(datenbestand) from {DB_TABLE_CURRENT}")
    last_update = cur.fetchone()[0]
    
    cur.execute(f"SELECT COUNT(*) FROM {DB_TABLE_CURRENT} WHERE updated_today = True")
    num_cases_updated_today = cur.fetchone()[0]

    logger.info(f"db data version: {last_update}")
    logger.info(f"fetched data version: {current_update}")
    logger.info(f"Number of LK publications for today in DB: {num_cases_updated_today}")
    logger.info(f"Number of LK publications for today in this update: {updated_today_count} (change: {updated_today_count-num_cases_updated_today})")
    logger.info(f"Prognosis number of cases for today: {prognosis_today}")

    if last_update is not None and abs((current_update - last_update).total_seconds()) <= 5:
        logger.info("Apply throttling (+/- 5min) and skip update")
        exit(0)
    else:
        logger.info('Insert new data into DB (takes 2-5 seconds)...')

        psycopg2.extras.execute_values (
            cur, QUERY, entries, template='(%(datenbestand)s, %(ags)s, %(cases)s, %(deaths)s, %(updated_today)s)', page_size=500
        )
        conn.commit()
        logger.info('Data inserted.')

        cur.execute("INSERT INTO risklayer_prognosis (datenbestand, prognosis) VALUES(%s, %s)", (current_update, prognosis_today))
        conn.commit()
        logger.info('Prognosis data inserted.')

        logger.info('Refreshing materialized view')
        cur.execute('set time zone \'UTC\'; REFRESH MATERIALIZED VIEW cases_per_county_and_day_risklayer;')
        conn.commit()


        logger.info('Send notification emails')

        notification_result = requests.post('https://api.coronavis.dbvis.de/sub/send-notifications',
                                            headers = {'X-API-KEY': os.getenv('API_KEY')})
        # notification_result = requests.post('http://localhost:5000/sub/send-notifications',
        #                                     headers={'X-API-KEY': os.getenv('API_KEY')})
        logger.info(notification_result.text)

        logger.info('Success')

        if(conn):
            cur.close()
            conn.close()

        exit(0)    
except (Exception, pg.DatabaseError) as error:
    conn, cur = get_connection()

    logger.error(error)
    logger.error("Error in transaction - Reverting all other operations of a transaction")
    logger.error("Most likely a simultaneous update was applied faster.")

    conn.rollback()

    if(conn):
        cur.close()
        conn.close()   

    exit(1)   
