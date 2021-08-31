#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer

import sys

import datetime
import logging
import json
from datetime import date

import psycopg2 as pg
import psycopg2.extras
import requests

from db_config import get_connection

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

logger.info('Crawler for RKI bed capacity per LK')


conn, cur = get_connection('crawl_rki_bed_capacity')

cur.execute("select max(datenbestand)::date from bed_capacity")
last_update = cur.fetchone()[0]

if last_update is not None and last_update >= date.today():
    logger.info('Data seems to be up to date (Database: %s, Today: %s). Won\'t fetch.', last_update, date.today())
    exit(0)


URL = "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset={}&resultRecordCount=2000&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token="


logger.debug('Fetch data')


data = None
has_data = True
offset = 0
while has_data:
    r = requests.get(URL.format(offset))
    rj = None
    try:
        rj = json.loads(r.text.encode().replace(b'\\\\',b'\\').decode('utf-8').encode('unicode-escape').replace(b'\\\\',b'\\').decode('unicode-escape'))
    except:
        rj = r.json()
    if data is None:
        data = rj
    else:
        data['features'].extend(rj['features'])
        if len(rj['features']) == 0:
            has_data = False
    offset += 2000
    logger.debug('Offset: %s', offset)
data = [d['properties'] for d in data['features']]


logger.info('Parse data')

entries = []
for el in data:
    if el['daten_stand'] is None:
        continue
    el['datenbestand'] = datetime.datetime.strptime(el['daten_stand'], '%d.%m.%Y %H:%M Uhr')
    del el['daten_stand']
    entries.append(el)
    
logger.debug('current LK count for bed capacity data: %s', len(entries))

aquery = 'INSERT INTO bed_capacity(datenbestand, BL, BL_ID, county, anzahl_standorte, anzahl_meldebereiche, betten_frei, betten_belegt, betten_gesamt, Anteil_betten_frei, faelle_covid_aktuell, faelle_covid_aktuell_beatmet, Anteil_covid_beatmet, Anteil_COVID_betten) VALUES %s'
try:  
    conn, cur = get_connection()

    cur.execute("Select Max(datenbestand) from bed_capacity")
    last_update = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM bed_capacity WHERE datenbestand = (SELECT MAX(datenbestand) FROM bed_capacity)")
    num_cases_in_db = cur.fetchone()[0]

    current_update = entries[0]['datenbestand'].replace(tzinfo=datetime.timezone(datetime.timedelta(hours=+1)))

    logger.info("db data version: %s", last_update)
    logger.info("fetched data version: %s", current_update)
    logger.info("Num in DB %s, num fetched %s", num_cases_in_db, len(entries))

    if last_update is not None and abs((current_update - last_update).total_seconds()) <= 2*60*60:
        logger.info("No new data available (+/- 2h), skip update")
    elif num_cases_in_db > 0 and len(entries) == 0:
        # when we have less entries fetched than we already have in the DB the RKI API probably did not return all cases
        logger.error("RKI API data blob is empty. Will fail this job and try again at next crawl time.")
        exit(2)
    else:
        logger.info('Insert new data into DB (takes 2-5 seconds)...')

        psycopg2.extras.execute_values (
            cur, aquery, entries, template='(%(datenbestand)s, %(BL)s, %(BL_ID)s, %(county)s, %(anzahl_standorte)s, %(anzahl_meldebereiche)s, %(betten_frei)s, %(betten_belegt)s, %(betten_gesamt)s, %(Anteil_betten_frei)s, %(faelle_covid_aktuell)s, %(faelle_covid_aktuell_beatmet)s, %(Anteil_covid_beatmet)s, %(Anteil_COVID_betten)s)', page_size=500
        )
        conn.commit()

        logger.info('Data inserted.')

        logger.info('Refreshing materialized view.')

        # TODO Wolfgang: Which view needs updating?
        #cur.execute('REFRESH MATERIALIZED VIEW cases_per_county_and_day')
        conn.commit()


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
