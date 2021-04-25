#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer

import sys
import time
import datetime
import logging
from datetime import date

import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras
import requests

from db_config import SQLALCHEMY_DATABASE_URI

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

logger.info('Crawler for RKI detailed case data')


def get_connection():
    conn = pg.connect(SQLALCHEMY_DATABASE_URI)
    conn.set_session(autocommit=False, isolation_level=psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE)
    cur = conn.cursor()
    return conn, cur


conn, cur = get_connection()


def process_county_ebrake(county_id) -> None:
    cur.execute(f"""
        SELECT timestamp, cases7_per_100k 
        FROM cases_per_county_and_day 
        WHERE county_id = '{county_id}'
        AND timestamp >= '2021-04-20' ORDER BY timestamp""")
    c_data = cur.fetchall()

    # delete existing ebrake data
    cur.execute(f"DELETE FROM counties_ebrake WHERE id = '{county_id}'")

    ret_data = []
    for d in c_data:
        ret_data.append({
            'id': county_id,
            'ts': d[0],
            'val': int(d[1]),
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


cur.execute("select max(datenbestand)::date from cases")
last_update = cur.fetchone()[0]

if last_update is not None and last_update >= date.today():
    logger.info('Data seems to be up to date (Database: %s, Today: %s). Won\'t fetch.', last_update, date.today())
    exit(0)

LIMIT = 5000

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
    conn, cur = get_connection()

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
    elif (len(entries) - num_cases_in_db) > 100000:
        logger.error("{} new entries in a single update (> 100k). Seems RKI API data blob is errornous. Will fail this job and try again at next crawl time.".format((len(entries) - num_cases_in_db)))
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

        cur.execute('REFRESH MATERIALIZED VIEW cases_per_county_and_day')
        conn.commit()

        logger.info('Calculate and inject ebrake data')
        # inject ebrake data
        cur.execute("SELECT county_id FROM cases_per_county_and_day GROUP BY county_id")
        county_ids = cur.fetchall()

        for c in county_ids:
            process_county_ebrake(c[0])

        logger.info('Refreshing materialized view again.')
        cur.execute('REFRESH MATERIALIZED VIEW cases_per_county_and_day')
        conn.commit()

        logger.info('Success')

        if (conn):
            cur.close()
            conn.close()

        exit(0)
except (Exception, pg.DatabaseError) as error:
    conn, cur = get_connection()

    logger.error(error)
    logger.error("Error in transction - Reverting all other operations of a transction")
    logger.error("Most likely a simultanious update was applied faster.")

    conn.rollback()

    if (conn):
        cur.close()
        conn.close()

    exit(1)
