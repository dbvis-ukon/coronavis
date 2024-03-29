#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer
import os
import logging
import subprocess

import jsonschema as jsonschema
import psycopg2.extensions
import psycopg2.extras
from psycopg2.extensions import cursor, connection
import requests
import json
from datetime import datetime, timezone
# noinspection PyUnresolvedReferences
import loadenv

# logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
from db_config import get_connection, retry_refresh

logging.basicConfig(level=logging.DEBUG, format='%(message)s')
logger = logging.getLogger(__name__)
logger.info('Crawler for divi public data')

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

JSONPAYLOAD = {"criteria":
                   {"bundesland": None,
                    "standortId": None,
                    "standortBezeichnung": "",
                    "bettenStatus": [],
                    "bettenKategorie": [],
                    # only look for beds for adults since otherwise it always uses the best possible status
                    # i.e., there are beds for kids available but none for adults: overall status is still available
                    # this request is also the default on the DIVI website
                    "behandlungsschwerpunktL1": ["ERWACHSENE"],
                    "behandlungsschwerpunktL2": [],
                    "behandlungsschwerpunktL3": []
                    },
               "pageNumber": 0,
               "pageSize": 3000
               }


def get_storage_path() -> str:
    if os.name == 'nt':  # debug only
        storage_path = './'
    else:
        storage_path = '/var/divi_public/'
    if not os.path.isdir(storage_path):
        logger.error(f"Storage path {storage_path} does not appear to be a valid directory")
        exit(1)
    return storage_path


def download_data(behandlungsschwerpunkt: str):
    logger.info(f'Assembling bearer and downloading data for {behandlungsschwerpunkt}...')
    JSONPAYLOAD['criteria']['behandlungsschwerpunktL1'] = [behandlungsschwerpunkt]
    # get private api data
    x = session.post(URL_API, json=JSONPAYLOAD)
    data = x.json()
    # infos
    # noinspection DuplicatedCode
    count = data['rowCount']
    logger.info(f'Downloaded data from {count} hospitals.')
    return data


def store_data(data, behandlungsschwerpunkt):
    storage_path = get_storage_path()
    current_update = datetime.now(timezone.utc)
    filepath = storage_path + current_update.strftime(
        "divi-public-%Y-%m-%dT%H-%M-%S") + '-' + behandlungsschwerpunkt + '.json'

    logger.info(f'Storing data on pvc: {filepath}')
    with open(filepath, 'w') as outfile:
        json.dump(data, outfile)


def validate_data(data):
    with open('./divi_public.schema.json') as schema:
        logger.info('Validate json data with schema')
        jsonschema.validate(data, json.load(schema))


# noinspection PyShadowingNames
def insert_data(conn: connection, cur: cursor, data, type: str):
    logger.info(f'Loading the data into the database')

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
        e = {'id': d['krankenhausStandort']['id'], 'meldezeitpunkt': d['letzteMeldezeitpunkt'],
             'statusEinschaetzungLowcare': d.get('maxBettenStatusEinschaetzungLowCare', 'KEINE_ANGABE'),
             'statusEinschaetzungHighcare': d['maxBettenStatusEinschaetzungHighCare'],
             'statusEinschaetzungEcmo': d['maxBettenStatusEinschaetzungEcmo'],
             'meldebereiche': [],
             'behandlungsschwerpunktL1': [type],
             'behandlungsschwerpunktL2': [],
             'behandlungsschwerpunktL3': []
             }
        if d['krankenhausStandort']['id'] == '773017':
            print(e)
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


try:
    conn, cur = get_connection('crawl_divi_public')

    for b in ["ERWACHSENE", "KINDER"]:
        data = download_data(b)
        store_data(data, b)
        validate_data(data)
        # load the newest data into the DB to overwrite the latest data
        insert_data(conn, cur, data, b)

    logger.info('Refreshing materialized view')
    retry_refresh(
        conn=conn,
        cur=cur,
        query='set time zone \'UTC\'; REFRESH MATERIALIZED VIEW CONCURRENTLY filled_hospital_timeseries_with_fix;'
    )

    cur.close()
    conn.close()

    print(subprocess.run(['fdupes', '-dN', '-o', 'name', get_storage_path()], capture_output=True))

    logger.info('Done. Exiting...')
except Exception as e:
    if cur:
        cur.close()
    if conn:
        conn.close()
    raise e
