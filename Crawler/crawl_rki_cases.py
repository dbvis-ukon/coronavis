#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer

import datetime

import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras
import requests

from db_config import SQLALCHEMY_DATABASE_URI

print('Crawler for RKI detailed case data')


def get_connection():
    conn = pg.connect(SQLALCHEMY_DATABASE_URI)
    conn.set_session(autocommit=False, isolation_level=psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE)
    cur = conn.cursor()
    return conn, cur


URL = "https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Meldedatum%20asc&resultOffset={}&resultRecordCount=2000&cacheHint=true"


print('Fetch data')


data = None
has_data = True
offset = 0
while has_data:
    r = requests.get(URL.format(offset))
    rj = r.json()
    if data is None:
        data = rj
    else:
        data['features'].extend(rj['features'])
        if len(rj['features']) == 0:
            has_data = False
    offset += 2000
    print(offset)
data = [d['attributes'] for d in data['features']]


print('Parse data')


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


print('current cases', len(entries))


aquery = 'INSERT INTO cases(datenbestand, idbundesland, bundesland, landkreis, idlandkreis, objectid, meldedatum, gender, agegroup, casetype) VALUES %s'
try:  
    conn, cur = get_connection()

    cur.execute("Select Max(datenbestand) from cases")
    last_update = cur.fetchone()[0]
    current_update = entries[0]['datenbestand'].replace(tzinfo=datetime.timezone(datetime.timedelta(hours=+1)))

    print("db data version:", last_update)
    print("fetched data version:", current_update)

    if last_update is not None and abs((current_update - last_update).total_seconds()) <= 2*60*60:
        print("No new data available (+/- 2h), skip update")
    else:
        print('Insert new data into DB (takes 2-5 seconds)...')

        psycopg2.extras.execute_values (
            cur, aquery, entries, template='(%(datenbestand)s, %(idbundesland)s, %(bundesland)s, %(landkreis)s, %(idlandkreis)s, %(objectid)s, %(meldedatum)s, %(gender)s, %(agegroup)s, %(casetype)s)', page_size=500
        )
        conn.commit()

        cur.execute('REFRESH MATERIALIZED VIEW cases_per_county_and_day')

        print('Success')

        if(conn):
            cur.close()
            conn.close()

        exit(0)    
except (Exception, pg.DatabaseError) as error:
    conn, cur = get_connection()

    print(error)
    print("Error in transction - Reverting all other operations of a transction")
    print("Most likely a simultanious update was applied faster.")

    conn.rollback()

    if(conn):
        cur.close()
        conn.close()   

    exit(1)   
