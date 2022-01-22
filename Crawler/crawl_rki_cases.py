#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer
import json
import sys
import time
import datetime
import logging
from datetime import date

import jsonschema
import psycopg2 as pg
import psycopg2.extras
import requests

# noinspection PyUnresolvedReferences
import loadenv
from db_config import get_connection, retry_refresh

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

logger.info('Crawler for RKI detailed case data')

conn, cur = get_connection('crawl_rki_cases')

cur.execute("select max(datenbestand)::date from cases")
last_update = cur.fetchone()[0]

if last_update is not None and last_update >= date.today():
    logger.info('Data seems to be up to date (Database: %s, Today: %s). Won\'t fetch.', last_update, date.today())
    cur.close()
    conn.close()
    exit(0)

# close db connection here because data downloading and parsing takes too long
cur.close()
conn.close()

LIMIT = 25000

URL = "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&resultOffset={offset}&resultRecordCount={limit}&cacheHint=true"
MAX_RETRIES = 5

logger.debug('Fetch data')

data = None
has_data = True
offset = 0
retries = 0
while has_data:
    while retries < MAX_RETRIES:
        r = requests.get(URL.format(offset=offset, limit=LIMIT))
        rj = r.json()
        if "error" in rj:
            retries += 1
            delay = 2 * retries
            logger.warning(f"Error in RKI API response ('{rj['error']['message']}'), retrying in {delay} sec...")
            time.sleep(delay)
        else:
            break
    if retries >= MAX_RETRIES:
        logger.error(f"Max retries ({MAX_RETRIES}) exceeded, aborting")
        exit(1)
    if data is None:
        data = rj
    else:
        data['features'].extend(rj['features'])
        if len(rj['features']) == 0:
            has_data = False
    offset += LIMIT
    logger.debug('Offset: %s', offset)
data = [d['attributes'] for d in data['features']]


with open('./rki_cases.schema.json') as schema:
    logger.info('Validate json data with schema')
    jsonschema.validate(data, json.load(schema))

logger.info('Parse data')

entries = []
for el in data:
    cc = ['case' for i in range(el['AnzahlFall'])]
    cc.extend(['death' for i in range(el['AnzahlTodesfall'])])
    entry = [{
        'datenbestand': datetime.datetime.strptime(el['Datenstand'], '%d.%m.%Y, %H:%M Uhr'),
        'idbundesland': el['IdBundesland'],
        'bundesland': el['Bundesland'],
        'landkreis': el['Landkreis'],
        'idlandkreis': el['IdLandkreis'],
        'objectid': el['ObjectId'],
        'meldedatum': datetime.datetime.utcfromtimestamp(el['Meldedatum'] / 1000),
        'gender': el['Geschlecht'],
        'agegroup': el['Altersgruppe'],
        'casetype': casetype
    } for casetype in cc]
    entries.extend(entry)

logger.debug('current entries: %s', len(entries))

aquery = 'INSERT INTO cases(datenbestand, idbundesland, bundesland, landkreis, idlandkreis, objectid, meldedatum, gender, agegroup, casetype) VALUES %s'
try:
    # reconnect to DB here
    conn, cur = get_connection('crawl_rki_cases')

    cur.execute("Select Max(datenbestand) from cases")
    last_update = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM cases WHERE datenbestand = (SELECT MAX(datenbestand) FROM cases)")
    num_cases_in_db = cur.fetchone()[0]

    current_update = entries[0]['datenbestand'].replace(tzinfo=datetime.timezone(datetime.timedelta(hours=+1)))

    logger.info("db data version: %s", last_update)
    logger.info("fetched data version: %s", current_update)
    logger.info("Num entries in DB %s, num entries fetched %s", num_cases_in_db, len(entries))

    if last_update is not None and abs((current_update - last_update).total_seconds()) <= 2 * 60 * 60:
        logger.info("No new data available (+/- 2h), skip update")
        exit(0)
    elif len(entries) < (num_cases_in_db - 1000):
        # when we have less entries fetched than we already have in the DB the RKI API probably did not return all cases
        logger.error("RKI API data blob is incomplete. Will fail this job and try again at next crawl time.")
        exit(2)
    elif (len(entries) - num_cases_in_db) > 200000:
        logger.error("{} new entries in a single update (> 200k). Seems RKI API data blob is errornous. Will fail this job and try again at next crawl time.".format((len(entries) - num_cases_in_db)))
        exit(2)
    else:
        logger.info('Insert new data into DB (takes 2-5 seconds)...')

        psycopg2.extras.execute_values(
            cur, aquery, entries,
            template='(%(datenbestand)s, %(idbundesland)s, %(bundesland)s, %(landkreis)s, %(idlandkreis)s, %(objectid)s, %(meldedatum)s, %(gender)s, %(agegroup)s, %(casetype)s)',
            page_size=500
        )
        conn.commit()

        logger.info('Data inserted.')

        logger.info('Refreshing materialized view.')

        retry_refresh(
            conn=conn,
            cur=cur,
            query='set time zone \'UTC\'; REFRESH MATERIALIZED VIEW CONCURRENTLY cases_per_county_and_day;'
        )

        logger.info('Success')

        if conn:
            cur.close()
            conn.close()

        exit(0)
except (Exception, pg.DatabaseError) as error:
    logger.error(error)
    logger.error("Error in transction - Reverting all other operations of a transction")
    logger.error("Most likely a simultanious update was applied faster.")

    conn.rollback()

    if conn:
        cur.close()
        conn.close()

    exit(1)
