#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer

import numpy as np
import pandas as pd
import psycopg2 as pg
import psycopg2.extras
import psycopg2.extensions
import re
import sys
import os
import json
import datetime
import requests

# create postgresql connection string
try:
    DB_HOST = os.environ.get('DB_HOST').replace('\n', '')
    DB_PORT = os.environ.get('DB_PORT').replace('\n', '')
    DB_USER = os.environ.get('DB_USER').replace('\n', '')
    DB_PASS = os.environ.get('DB_PASS').replace('\n', '')
    DB_NAME = os.environ.get('DB_NAME').replace('\n', '')

    if None in (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME):
        raise KeyError

    SQLALCHEMY_DATABASE_URI = f"dbname='{DB_NAME}' user='{DB_USER}' host='{DB_HOST}' password='{DB_PASS}' port={DB_PORT}"

except KeyError as e:
    logger.error('One or multiple necessary environment variables not set, stopping crawler')
<<<<<<< HEAD
    # return non-zero exit code to indicate an error
    sys.exit(1)
=======
    sys.exit()
>>>>>>> 08e0c974f998409d7a2c279f99cc6106b68b2fb9

print('Crawler for DIVI Data')


def get_connection():
    conn = pg.connect(SQLALCHEMY_DATABASE_URI)
    conn.set_session(autocommit=False, isolation_level=psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE)
    cur = conn.cursor()
    return conn, cur


URL = "https://diviexchange.z6.web.core.windows.net"


print('Fetch data')
response = requests.get(URL)
html = response.text
regex = r"\"datasets\": ({.+?), {\"mode\": \"vega-lite\"}\)"
match = re.findall(regex, html, re.DOTALL)
data = json.loads(match[0][0:-1])


def rep(e):
    d = {}
    for key, entry in e.items():
        d[key.replace('(','').replace(')', '').replace(' ', '_').replace('-', '').lower()] = entry
    return d

# sort keys by length of containing arrays, the longest one is the hospitals list
x = [k for k, v in sorted(data.items(), key=lambda item: len(item[1]))]
x.reverse()
key = x[0]

# parse data
entries = [rep(entry) for entry in data[key]]

print('entries hospitals', len(entries))


aquery = 'INSERT INTO divi_hospital_capacities_and_cases(datenbestand, gemeindeschluessel, ort, bundeslandschluessel, plz, webaddresse, icu_low_care_frei, icu_low_care_belegt, icu_low_care_einschaetzung, icu_low_care_in_24h, icu_high_care_frei, icu_high_care_belegt, icu_high_care_einschaetzung, icu_high_care_in_24h, icu_ecmo_care_frei, icu_ecmo_care_belegt, icu_ecmo_care_einschaetzung, icu_ecmo_care_in_24h, ecmo_faelle_jahr, covid19_aktuell, covid19_kumulativ, covid19_beatmet, covid19_verstorben, geom) VALUES %s'

try:  
    conn, cur = get_connection()

    cur.execute("SELECT Max(datenbestand) from divi_hospital_capacities_and_cases")
    last_update = cur.fetchone()[0]

    print("db data version:", last_update)
    print("fetched data version:", datetime.datetime.now())
    print('Insert new data into DB...')

    psycopg2.extras.execute_values (
    cur, aquery, entries, template='(\''+ str(datetime.datetime.now()) + '\', %(gemeindeschluessel)s, %(ort)s, %(bundesland)s, %(plz)s, %(webadresse)s, %(icu_low_care_frei)s, %(icu_low_care_belegt)s, %(icu_low_care_einschätzung)s, %(icu_low_care_in_24_h_anzahl)s, %(icu_high_care_frei)s, %(icu_high_care_belegt)s, %(icu_high_care_einschätzung)s, %(icu_high_care_in_24_h_anzahl)s, %(icu_ecmo_frei)s, %(icu_ecmo_belegt)s, %(icu_ecmo_care_einschätzung)s, %(icu_ecmo_care_in_24_h_anzahl)s, %(anzahl_ecmofälle_pro_jahr)s, %(covid19_aktuell)s, %(covid19_kumulativ)s, %(covid19_beatmet)s, %(covid19_verstorben)s, ST_SetSRID( ST_Point(%(lon)s, %(lat)s), 4326))', page_size=500
)
    conn.commit()

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





