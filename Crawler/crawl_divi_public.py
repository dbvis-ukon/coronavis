#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer
import os
import logging

import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras
import requests
import json
from datetime import datetime, timezone
# noinspection PyUnresolvedReferences
import loadenv

# logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
from db_config import SQLALCHEMY_DATABASE_URI

logging.basicConfig(level=logging.DEBUG, format='%(message)s')
logger = logging.getLogger(__name__)
logger.info('Crawler for divi public data')

STORAGE_PATH = "/var/divi_public/"

URL_API = "https://www.intensivregister.de/api/public/intensivregister"

header_base = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/86.0.4298.4 Safari/537.36 '
}

# start session
session = requests.Session()
session.headers.update(header_base)

# prepare bearer token
headers = {
    'Content-Type': 'application/json',
}
session.headers.update(headers)

logger.info('Assembling bearer and downloading data...')
# get private api data
x = session.post(URL_API, json={})
data = x.json()

# infos
count = data['rowCount']
logger.info(f'Downloaded data from {count} hospitals.')

#
# store data
# 
if os.name == 'nt':  # debug only
    STORAGE_PATH = './'
if not os.path.isdir(STORAGE_PATH):
    logger.error(f"Storage path {STORAGE_PATH} does not appear to be a valid directory")
    exit(1)
current_update = datetime.now(timezone.utc)
filepath = STORAGE_PATH + current_update.strftime("divi-%Y-%m-%dT%H-%M-%S") + '.json'

logger.info(f'Storing data on pvc: {filepath}')
with open(filepath, 'w') as outfile:
    json.dump(data, outfile)

logger.info(f'Loading the data into the database')


# logger.debug(data)

def get_connection():
    conn = pg.connect(SQLALCHEMY_DATABASE_URI)
    conn.set_session(autocommit=False, isolation_level=psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE)
    cur = conn.cursor()
    return conn, cur


conn, cur = get_connection()


# noinspection PyShadowingNames
def insert_data(data):
    query_krankenhaus_standorte = f'INSERT INTO divi_krankenhaus_standorte ' \
                                  f'(id, bezeichnung, strasse, hausnummer, plz, ort, bundesland, iknummer, ' \
                                  f'position) ' \
                                  f'VALUES %s ON CONFLICT ON CONSTRAINT divi_krankenhaus_standorte_pk DO ' \
                                  f'UPDATE SET ' \
                                  f'bezeichnung = EXCLUDED.bezeichnung, ' \
                                  f'strasse = EXCLUDED.strasse, ' \
                                  f'hausnummer = EXCLUDED.hausnummer, ' \
                                  f'plz = EXCLUDED.plz, ' \
                                  f'ort = EXCLUDED.ort, ' \
                                  f'bundesland = EXCLUDED.bundesland, ' \
                                  f'iknummer = EXCLUDED.iknummer, ' \
                                  f'position = EXCLUDED.position;'

    entries_kh_standorte = []

    for d in data['data']:
        e = d['krankenhausStandort']
        e['pos_lon'] = e['position']['longitude']
        e['pos_lat'] = e['position']['latitude']
        entries_kh_standorte.append(e)

    # print(entries_kh_standorte)
    psycopg2.extras.execute_values(
        cur,
        query_krankenhaus_standorte,
        entries_kh_standorte,
        template='(%(id)s, %(bezeichnung)s, %(strasse)s, %(hausnummer)s, %(plz)s, %(ort)s, %(bundesland)s, '
                 '%(ikNummer)s, ST_SetSRID(ST_POINT(%(pos_lon)s, %(pos_lat)s), 4326))',
        page_size=500
    )
    conn.commit()

    query_krankenhaus_meldungen = f'INSERT INTO divi_meldungen ' \
                                  f'(private, meldezeitpunkt, kh_id, meldebereiche, statuseinschaetzunglowcare, ' \
                                  f'statuseinschaetzunghighcare, statuseinschaetzungecmo, behandlungsschwerpunktl1, ' \
                                  f'behandlungsschwerpunktl2, behandlungsschwerpunktl3) ' \
                                  f'VALUES %s ON CONFLICT ON CONSTRAINT divi_meldungen_pk DO ' \
                                  f'UPDATE SET ' \
                                  f'meldebereiche = EXCLUDED.meldebereiche, ' \
                                  f'statuseinschaetzunglowcare = EXCLUDED.statuseinschaetzunglowcare, ' \
                                  f'statuseinschaetzunghighcare = EXCLUDED.statuseinschaetzunghighcare, ' \
                                  f'statuseinschaetzungecmo = EXCLUDED.statuseinschaetzungecmo, ' \
                                  f'behandlungsschwerpunktl1 = EXCLUDED.behandlungsschwerpunktl1, ' \
                                  f'behandlungsschwerpunktl2 = EXCLUDED.behandlungsschwerpunktl2, ' \
                                  f'behandlungsschwerpunktl3 = EXCLUDED.behandlungsschwerpunktl3;'

    entries_meldunden = []

    for d in data['data']:
        e = d
        e['statusEinschaetzungLowcare'] = d['bettenStatus']['statusLowCare']
        e['statusEinschaetzungHighcare'] = d['bettenStatus']['statusHighCare']
        e['statusEinschaetzungEcmo'] = d['bettenStatus']['statusECMO']
        entries_meldunden.append(e)

    psycopg2.extras.execute_values(
        cur,
        query_krankenhaus_meldungen,
        entries_meldunden,
        template='(false, %(meldezeitpunkt)s, %(id)s, %(meldebereiche)s, %(statusEinschaetzungLowcare)s, '
                 '%(statusEinschaetzungHighcare)s, %(statusEinschaetzungEcmo)s, %(behandlungsschwerpunktL1)s, '
                 '%(behandlungsschwerpunktL2)s, %(behandlungsschwerpunktL3)s)',
        page_size=500
    )
    conn.commit()


# load the newest data into the DB to overwrite the latest data
insert_data(data)

logger.info('Refreshing materialized view')
cur.execute('set time zone \'UTC\'; REFRESH MATERIALIZED VIEW filled_hospital_timeseries_with_fix;')
conn.commit()

logger.info('Done. Exiting...')

exit(0)
