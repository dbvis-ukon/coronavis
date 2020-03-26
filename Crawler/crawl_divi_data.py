#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer

import numpy as np
import pandas as pd
import psycopg2 as pg
import psycopg2.extras
import psycopg2.extensions
import re
import json
import datetime
import requests

from db_config import SQLALCHEMY_DATABASE_URI

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

entries = [rep(entry) for entry in data['data-391c21da2b2a91c905172447fb8d1284']]


print('entries hospitals', len(entries))


aquery = 'INSERT INTO divi_hospital_capacities_and_cases(datenbestand, gemeindeschluessel, ort, bundeslandschluessel, plz, webaddresse, icu_low_care_frei, icu_low_care_belegt, icu_low_care_einschaetzung, icu_low_care_in_24h, icu_high_care_frei, icu_high_care_belegt, icu_high_care_einschaetzung, icu_high_care_in_24h, icu_ecmo_care_frei, icu_ecmo_care_belegt, icu_ecmo_care_einschaetzung, icu_ecmo_care_in_24h, ecmo_faelle_jahr, covid19_aktuell, covid19_kumulativ, covid19_beatmet, covid19_verstorben) VALUES %s'
try:  
    conn, cur = get_connection()
    cur.execute("Select Max(datenbestand) from divi_hospital_capacities_and_cases")
    last_update = cur.fetchone()[0]
    print("db data version:", last_update)
    print("fetched data version:", datetime.datetime.now())
    print('Insert new data into DB...')
    psycopg2.extras.execute_values (
    cur, aquery, entries, template='(\''+ str(datetime.datetime.now()) + '\', %(gemeindeschluessel)s, %(ort)s, %(bundesland)s, %(plz)s, %(webadresse)s, %(icu_low_care_frei)s, %(icu_low_care_belegt)s, %(icu_low_care_einschätzung)s, %(icu_low_care_in_24_h_anzahl)s, %(icu_high_care_frei)s, %(icu_high_care_belegt)s, %(icu_high_care_einschätzung)s, %(icu_high_care_in_24_h_anzahl)s, %(icu_ecmo_frei)s, %(icu_ecmo_belegt)s, %(icu_ecmo_care_einschätzung)s, %(icu_ecmo_care_in_24_h_anzahl)s, %(anzahl_ecmofälle_pro_jahr)s, %(covid19_aktuell)s, %(covid19_kumulativ)s, %(covid19_beatmet)s, %(covid19_verstorben)s)', page_size=500
)
    conn.commit()
    print('Success')
    if(conn):
        cur.close()
        conn.close()
    exit(0)    
except (Exception, pg.DatabaseError) as error :
    print(error)
    print("Error in transction - Reverting all other operations of a transction")
    print("Most likely a simultanious update was applied faster.")
    conn.rollback()
    if(conn):
        cur.close()
        conn.close()   
    exit(1)   





