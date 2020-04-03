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


def rep(e):
    d = {}
    for key, entry in e.items():
        d[key.replace('(','').replace(')', '').replace(' ', '_').replace('-', '').lower()] = entry
    return d

print('Fetch data')
response = requests.get(URL)
html = response.text

regex = r"vegaEmbed\(\"#left\", (.+?), \{\"renderer\": \"canvas\", \"actions\": false\}\);"
print('First try at parsing')
match = re.findall(regex, html, re.DOTALL)

try:
    if len(match) != 1:
        raise Error()
    data = json.loads(match[0])
    if not 'datasets' in data:
        raise Error()
except:
    print("Divi Data format has undergone a major change again, crawler needs regex update.")
    exit(2)
    
print('Parsing for Covid-19 current')
# sort keys by length of containing arrays, the longest one is the hospitals list
covid19_current = [v for k, v in sorted(data['datasets'].items(), key=lambda item: len(item[1]), reverse=True)][0]
entries_covid19 = [rep(entry) for entry in covid19_current]
print('entries hospitals', len(entries_covid19))

#
# disabled due to divi shutdown
#
# hospitaldata = [v for k, v in sorted(data.items(), key=lambda item: len(item[1]), reverse=True)][0]
# entries = [rep(entry) for entry in hospitaldata]
# print('entries hospitals', len(entries))







aqueryOld = 'INSERT INTO divi_hospital_capacities_and_cases(datenbestand, gemeindeschluessel, ort, bundeslandschluessel, plz, webaddresse, icu_low_care_frei, icu_low_care_belegt, icu_low_care_einschaetzung, icu_low_care_in_24h, icu_high_care_frei, icu_high_care_belegt, icu_high_care_einschaetzung, icu_high_care_in_24h, icu_ecmo_care_frei, icu_ecmo_care_belegt, icu_ecmo_care_einschaetzung, icu_ecmo_care_in_24h, ecmo_faelle_jahr, covid19_aktuell, covid19_kumulativ, covid19_beatmet, covid19_verstorben, geom) VALUES %s'

aqueryCovid19 = 'INSERT INTO divi_hospital_covid19_aktuell(datenbestand, klinikname, covid19_aktuell, geom) VALUES %s'

try:  
    conn, cur = get_connection()

    #
    # old divi insert
    #
    #cur.execute("SELECT Max(datenbestand) from divi_hospital_capacities_and_cases")
    #last_update = cur.fetchone()[0]
    #
    #now = datetime.datetime.now().replace(tzinfo=datetime.timezone(datetime.timedelta(hours=+1)))
    #print("db data version:", last_update)
    #print("fetched data version:", now)
    #print('Insert new data into DB...')
    #
    #psycopg2.extras.execute_values (
    #cur, aqueryOld, entries, template='(\''+ str(now) + '\', %(gemeindeschluessel)s, %(ort)s, %(bundesland)s, %(plz)s, %(webadresse)s, %(icu_low_care_frei)s, %(icu_low_care_belegt)s, %(icu_low_care_einschätzung)s, %(icu_low_care_in_24_h_anzahl)s, %(icu_high_care_frei)s, %(icu_high_care_belegt)s, %(icu_high_care_einschätzung)s, %(icu_high_care_in_24_h_anzahl)s, %(icu_ecmo_frei)s, %(icu_ecmo_belegt)s, %(icu_ecmo_care_einschätzung)s, %(icu_ecmo_care_in_24_h_anzahl)s, %(anzahl_ecmofälle_pro_jahr)s, %(covid19_aktuell)s, %(covid19_kumulativ)s, %(covid19_beatmet)s, %(covid19_verstorben)s, ST_SetSRID( ST_Point(%(lon)s, %(lat)s), 4326))', page_size=500
    #)
    
    #
    # covid 19 divi data
    #
    
    cur.execute("SELECT Max(datenbestand) from divi_hospital_covid19_aktuell")
    last_update = cur.fetchone()[0]

    now = datetime.datetime.now().replace(tzinfo=datetime.timezone(datetime.timedelta(hours=+1)))
    print("db data version:", last_update)
    print("fetched data version:", now)
    if last_update is not None and abs((current_update - last_update).total_seconds()) <= (60*60 - 120):
        print("No new data available (+/- 1h), skip update")
    else:    
        print('Insert new data into DB...')

        psycopg2.extras.execute_values (
        cur, aqueryCovid19, entries_covid19, template='(\''+ str(now) + '\', %(klinikname)s, %(covid19_aktuell)s, ST_SetSRID( ST_Point(%(lon)s, %(lat)s), 4326))', page_size=500
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





