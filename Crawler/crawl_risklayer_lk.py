#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer

import os
import datetime
import logging
from datetime import datetime

import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras
import requests

#from db_config import SQLALCHEMY_DATABASE_URI
import sys
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

logger = logging.getLogger(__name__)
logger.info('Crawler for Risklayer spreadsheet and case data')
logger.info('UNDER DEVELOPMENT')

URL = "https://docs.google.com/spreadsheets/d/1wg-s4_Lz2Stil6spQEYFdZaBEp8nWW26gVyfHqvcl8s/export?format=xlsx"
STORAGE_PATH = "/var/risklayer_spreadsheets/"
NUM_RETRIES = 5
WAIT_MS_RETRY = 5000

def get_connection():
    conn = pg.connect(SQLALCHEMY_DATABASE_URI)
    conn.set_session(autocommit=False, isolation_level=psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE)
    cur = conn.cursor()
    return conn, cur

logger.debug('Fetch risklayer spreadsheet')

current_try = 1
while current_try <= NUM_RETRIES:
    try:
        r = requests.get(URL, allow_redirects=True)
        if os.name == 'nt': # debug only
            STORAGE_PATH = './'
        if not os.path.isdir(STORAGE_PATH):
            logger.error(f"Storage path {STORAGE_PATH} does not appear to be a valid directory")
            exit(1)
        filepath = STORAGE_PATH + datetime.today().strftime("%Y-%m-%dT%H-%M-%S") + '.xlsx'
        with open(filepath, 'wb') as f:
            f.write(r.content)
            logger.info(f'Download succeeded.')
            break
    except:
        logger.info(f'Failed download spreadsheet try {current_try}/{NUM_RETRIES}, retrying...')
        current_try += 1
if current_try > NUM_RETRIES:
    logger.error(f"Number of retries ({NUM_RETRIES}) has been excideed.")
    exit(1)

logger.info('Parse data, TODO')


#aquery = 'INSERT INTO cases(datenbestand, idbundesland, bundesland, landkreis, idlandkreis, objectid, meldedatum, gender, agegroup, casetype) VALUES %s'
try:  
    #conn, cur = get_connection()

    #cur.execute("Select Max(datenbestand) from cases")
    #last_update = cur.fetchone()[0]

    #cur.execute("SELECT COUNT(*) FROM cases WHERE datenbestand = (SELECT MAX(datenbestand) FROM cases)")
    #num_cases_in_db = cur.fetchone()[0]

    #current_update = entries[0]['datenbestand'].replace(tzinfo=datetime.timezone(datetime.timedelta(hours=+1)))

    #logger.info("db data version: %s", last_update)
    #logger.info("fetched data version: %s", current_update)
    #logger.info("Num cases in DB %s, num cases fetched %2", num_cases_in_db, len(entries))

    #if last_update is not None and abs((current_update - last_update).total_seconds()) <= 2*60*60:
    #    logger.info("No new data available (+/- 2h), skip update")
    #    exit(0)
    #elif len(entries) < (num_cases_in_db - 1000):
    #    # when we have less entries fetched than we already have in the DB the RKI API probably did not return all cases
    #    logger.error("RKI API data blob is incomplete. Will fail this job and try again at next crawl time.")
    #    exit(2)
    #else:
    #    logger.info('Insert new data into DB (takes 2-5 seconds)...')

    #    psycopg2.extras.execute_values (
    #        cur, aquery, entries, template='(%(datenbestand)s, %(idbundesland)s, %(bundesland)s, %(landkreis)s, %(idlandkreis)s, %(objectid)s, %(meldedatum)s, %(gender)s, %(agegroup)s, %(casetype)s)', page_size=500
    #    )
    #    conn.commit()

    #    logger.info('Data inserted.')

    #    logger.info('Refreshing materialized view.')

    #    cur.execute('REFRESH MATERIALIZED VIEW cases_per_county_and_day')
    #    conn.commit()


    #    logger.info('Success')

    #    if(conn):
    #        cur.close()
    #        conn.close()

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
