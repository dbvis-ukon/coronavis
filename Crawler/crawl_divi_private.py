#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer
import os
import logging
import subprocess

import jsonschema
import psycopg2.extensions
import psycopg2.extras
import requests
import re
import json
from datetime import datetime, timezone
# noinspection PyUnresolvedReferences
import loadenv

# logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
from db_config import get_connection

logging.basicConfig(level=logging.DEBUG, format='%(message)s')
logger = logging.getLogger(__name__)
logger.info('Crawler for divi private data')

STORAGE_PATH = "/var/divi_private/"

USERNAME = os.environ.get('DIVI_USERNAME').replace('\n', '')
PASSWORD = os.environ.get('DIVI_PASSWORD').replace('\n', '')

URL_LOGIN = "https://auth.intensivregister.de/auth/realms/intensivregister/protocol/openid-connect/auth?client_id" \
            "=intensivregister-frontend&redirect_uri=https%3A%2F%2Fwww.intensivregister.de%2F%23%2Findex" \
            "&response_mode=fragment&response_type=code&scope=openid "
URL_AUTH = ""  # will be provided dynamically below
URL_STARTPAGE = ""  # will be provided dynamically below
URL_TOKEN = "https://auth.intensivregister.de/auth/realms/intensivregister/protocol/openid-connect/token"
URL_API = "https://www.intensivregister.de/api/intensivregister"
URL_LOGOUT = "https://auth.intensivregister.de/auth/realms/intensivregister/protocol/openid-connect/logout" \
             "?redirect_uri=https%3A%2F%2Fwww.intensivregister.de "

# payload = { "criteria":
#           {
#                "bundesland":None,
#                "standortId":None,
#                "standortBezeichnung":None,
#                "geoSearch":None
#           },
#           "pageNumber": 0,
#           "pageSize": None
#          }

header_base = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) '
                  'Chrome/86.0.4298.4 Safari/537.36 '
}
auth_data = {
    'username': USERNAME,
    'password': PASSWORD,
    'credentialId': ''
}

# start session
session = requests.Session()
session.headers.update(header_base)

# get inital keyclock tokens
logger.info('Open divi website to get initial tokens')
html = session.get(URL_LOGIN)

# extract login form url and session parameters
m = re.search('action="(.+?)" method="post"', html.text)
# noinspection PyRedeclaration
URL_AUTH = m.group(1).replace('&amp;', '&')
logger.info(f'auth url {URL_AUTH}')

# try to log in
logger.info('Try logging in...')
r_auth = session.post(URL_AUTH, data=auth_data, allow_redirects=False)  # allow_redirect false to allow cookie storage

# login result
if r_auth.status_code == 302:
    logger.info('Login succeeded')
else:
    logger.error("Login failed")
    exit(1)

# propagate auth tokens to divi frontend by cookies
URL_STARTPAGE = r_auth.headers['Location']
session.get(URL_STARTPAGE)

# get special session code
logger.info('Getting special session code')
m = re.search('.+code=(.+)', URL_STARTPAGE)
code = m.group(1)

# request token data
token_data = {
    'code': code,
    'grant_type': 'authorization_code',
    'client_id': 'intensivregister-frontend',
    'redirect_uri': 'https://www.intensivregister.de/#/index'
}
logger.info('Requesting token data')
r_token = session.post(URL_TOKEN, data=token_data,
                       allow_redirects=False)  # allow_redirect false to allow cookie storage
token_data = r_token.json()

# prepare bearer token
headers = {
    'Content-Type': 'application/json',
    'authorization': f"bearer {token_data['access_token']}"
}
session.headers.update(headers)

logger.info('Assembling bearer and downloading data...')
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

# get private api data
x = session.post(URL_API, json=JSONPAYLOAD)
data = x.json()

# logout
logger.info('Logout')
html = session.get(URL_LOGOUT)

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
filepath = STORAGE_PATH + current_update.strftime("divi-private-%Y-%m-%dT%H-%M-%S") + '.json'

logger.info(f'Storing data on pvc: {filepath}')
with open(filepath, 'w') as outfile:
    json.dump(data, outfile)

with open('./divi_private.schema.json') as schema:
    logger.info('Validate json data with schema')
    jsonschema.validate(data, json.load(schema))

logger.info(f'Loading the data into the database')

# logger.debug(data)

conn, cur = get_connection('crawl_divi_private')


# noinspection PyShadowingNames
def insert_data(data):
    query_krankenhaus_standorte = f'INSERT INTO divi_krankenhaus_standorte ' \
                                  f'(id, bezeichnung, strasse, hausnummer, plz, ort, bundesland, iknummer, ' \
                                  f'position, intensivmedizinischeplanbetten, ' \
                                  f'meldebereichenichtvollstaendig, gemeindeschluessel) ' \
                                  f'VALUES %s ON CONFLICT ON CONSTRAINT divi_krankenhaus_standorte_pk DO ' \
                                  f'UPDATE SET ' \
                                  f'bezeichnung = EXCLUDED.bezeichnung, ' \
                                  f'strasse = EXCLUDED.strasse, ' \
                                  f'hausnummer = EXCLUDED.hausnummer, ' \
                                  f'plz = EXCLUDED.plz, ' \
                                  f'ort = EXCLUDED.ort, ' \
                                  f'bundesland = EXCLUDED.bundesland, ' \
                                  f'iknummer = EXCLUDED.iknummer, ' \
                                  f'position = EXCLUDED.position, ' \
                                  f'intensivmedizinischeplanbetten = EXCLUDED.intensivmedizinischeplanbetten, ' \
                                  f'meldebereichenichtvollstaendig = EXCLUDED.meldebereichenichtvollstaendig, ' \
                                  f'gemeindeschluessel = EXCLUDED.gemeindeschluessel;'

    entries_kh_standorte = []

    for d in data['data']:
        e = d['krankenhausStandort']
        e['intensivmedizinischePlanbetten'] = None
        e['meldebereicheNichtVollstaendig'] = None
        e['pos_lon'] = e['position']['longitude']
        e['pos_lat'] = e['position']['latitude']
        entries_kh_standorte.append(e)

    # print(entries_kh_standorte)
    psycopg2.extras.execute_values(
        cur,
        query_krankenhaus_standorte,
        entries_kh_standorte,
        template='(%(id)s, %(bezeichnung)s, %(strasse)s, %(hausnummer)s, %(plz)s, %(ort)s, %(bundesland)s, '
                 '%(ikNummer)s, ST_SetSRID(ST_POINT(%(pos_lon)s, %(pos_lat)s), 4326), '
                 '%(intensivmedizinischePlanbetten)s, %(meldebereicheNichtVollstaendig)s, %(gemeindeschluessel)s)',
        page_size=500
    )
    conn.commit()

    query_krankenhaus_meldungen = f'INSERT INTO divi_meldungen ' \
                                  f'(private, meldezeitpunkt, kh_id, bettenmeldungecmo, bettenmeldunglowcare, ' \
                                  f'bettenmeldunghighcare, faellecovidaktuell, faellecovidaktuellbeatmet, ' \
                                  f'faellecovidgenesen, faellecovidverstorben, betriebssituation, ' \
                                  f'betriebseinschraenkungpersonal, betriebseinschraenkungraum, ' \
                                  f'betriebseinschraenkungbeatmungsgeraet, betriebseinschraenkungverbrauchsmaterial, ' \
                                  f'meldebereiche, ardsnetzwerkmitglied, intensivbetten, intensivbettenbelegt, ' \
                                  f'patienteninvasivbeatmet, patientenecmo, freieivkapazitaet, freieecmokapazitaet, ' \
                                  f'intensivbettennotfall7d, statuseinschaetzunglowcare, ' \
                                  f'statuseinschaetzunghighcare, statuseinschaetzungecmo, behandlungsschwerpunktl1, ' \
                                  f'behandlungsschwerpunktl2, behandlungsschwerpunktl3, ' \
                                  f'faellecovidaktuellnichtinvasivbeatmet, faellecovidaktuellecmo )' \
                                  f'VALUES %s ON CONFLICT ON CONSTRAINT divi_meldungen_pk DO ' \
                                  f'UPDATE SET ' \
                                  f'bettenmeldungecmo = EXCLUDED.bettenmeldungecmo, ' \
                                  f'bettenmeldunglowcare = EXCLUDED.bettenmeldunglowcare, ' \
                                  f'bettenmeldunghighcare = EXCLUDED.bettenmeldunghighcare, ' \
                                  f'faellecovidaktuell = EXCLUDED.faellecovidaktuell, ' \
                                  f'faellecovidverstorben = EXCLUDED.faellecovidverstorben, ' \
                                  f'betriebssituation = EXCLUDED.betriebssituation, ' \
                                  f'betriebseinschraenkungpersonal = EXCLUDED.betriebseinschraenkungpersonal, ' \
                                  f'betriebseinschraenkungraum = EXCLUDED.betriebseinschraenkungraum, ' \
                                  f'betriebseinschraenkungbeatmungsgeraet = ' \
                                  f'    EXCLUDED.betriebseinschraenkungbeatmungsgeraet, ' \
                                  f'betriebseinschraenkungverbrauchsmaterial = ' \
                                  f'    EXCLUDED.betriebseinschraenkungverbrauchsmaterial, ' \
                                  f'meldebereiche = EXCLUDED.meldebereiche, ' \
                                  f'ardsnetzwerkmitglied = EXCLUDED.ardsnetzwerkmitglied, ' \
                                  f'intensivbetten = EXCLUDED.intensivbetten, ' \
                                  f'intensivbettenbelegt = EXCLUDED.intensivbettenbelegt, ' \
                                  f'patienteninvasivbeatmet = EXCLUDED.patienteninvasivbeatmet, ' \
                                  f'patientenecmo = EXCLUDED.patientenecmo, ' \
                                  f'freieivkapazitaet = EXCLUDED.freieivkapazitaet, ' \
                                  f'freieecmokapazitaet = EXCLUDED.freieecmokapazitaet, ' \
                                  f'intensivbettennotfall7d = EXCLUDED.intensivbettennotfall7d, ' \
                                  f'statuseinschaetzunglowcare = EXCLUDED.statuseinschaetzunglowcare, ' \
                                  f'statuseinschaetzunghighcare = EXCLUDED.statuseinschaetzunghighcare, ' \
                                  f'statuseinschaetzungecmo = EXCLUDED.statuseinschaetzungecmo, ' \
                                  f'behandlungsschwerpunktl1 = EXCLUDED.behandlungsschwerpunktl1, ' \
                                  f'behandlungsschwerpunktl2 = EXCLUDED.behandlungsschwerpunktl2, ' \
                                  f'behandlungsschwerpunktl3 = EXCLUDED.behandlungsschwerpunktl3,' \
                                  f'faellecovidaktuellnichtinvasivbeatmet = EXCLUDED.faellecovidaktuellnichtinvasivbeatmet, ' \
                                  f'faellecovidaktuellecmo = EXCLUDED.faellecovidaktuellecmo;'

    entries_meldunden = []

    for d in data['data']:
        e = {'meldezeitpunkt': d['letzteMeldezeitpunkt'], 'id': d['krankenhausStandort']['id'],
             'bettenmeldungECMO': None, 'bettenmeldungLowCare': None, 'bettenmeldungHighCare': None,
             'faelleCovidAktuell': d['faelleCovidAktuell'], 'faelleCovidAktuellBeatmet': d['faelleCovidAktuellBeatmet'],
             'faelleCovidGenesen': d['faelleCovidGenesen'], 'faelleCovidVerstorben': d['faelleCovidVerstorben'],
             'betriebssituation': d['bestBetriebssituation'], 'betriebseinschraenkungPersonal': None,
             'betriebseinschraenkungRaum': None, 'betriebseinschraenkungBeatmungsgeraet': None,
             'betriebseinschraenkungVerbrauchsmaterial': None,
             'meldebereiche': list(map(lambda x: x['meldebereichBezeichnung'], d['meldebereiche'])),
             'ardsNetzwerkMitglied': None, 'intensivBetten': d['intensivBettenGesamt'],
             'intensivBettenBelegt': d['intensivBettenBelegt'], 'patientenInvasivBeatmet': d['patientenIvBeatmet'],
             'patientenEcmo': d['patientenEcmoBeatmet'], 'freieIvKapazitaet': d['freieIvKapazitaet'],
             'freieEcmoKapazitaet': d['freieEcmoKapazitaet'], 'intensivBettenNotfall7d': d['intensivBettenNotfall7d'],
             'statusEinschaetzungLowcare': d['maxBettenStatusEinschaetzungLowCare'],
             'statusEinschaetzungHighcare': d['maxBettenStatusEinschaetzungHighCare'],
             'statusEinschaetzungEcmo': d['maxBettenStatusEinschaetzungEcmo'],
             'behandlungsschwerpunktL1': list(map(lambda x: x['behandlungsschwerpunktL1'], d['meldebereiche'])),
             'behandlungsschwerpunktL2': list(map(lambda x: x['behandlungsschwerpunktL2'], d['meldebereiche'])),
             'behandlungsschwerpunktL3': list(map(lambda x: x['behandlungsschwerpunktL3'], d['meldebereiche'])),
             'faelleCovidAktuellNichtInvasivBeatmet': d['faelleCovidAktuellNichtInvasivBeatmet'],
             'faelleCovidAktuellEcmo': d['faelleCovidAktuellEcmo']}
        entries_meldunden.append(e)

    psycopg2.extras.execute_values(
        cur,
        query_krankenhaus_meldungen,
        entries_meldunden,
        template='(true, %(meldezeitpunkt)s, %(id)s, %(bettenmeldungECMO)s, %(bettenmeldungLowCare)s, '
                 '%(bettenmeldungHighCare)s, %(faelleCovidAktuell)s, %(faelleCovidAktuellBeatmet)s, '
                 '%(faelleCovidGenesen)s, %(faelleCovidVerstorben)s, %(betriebssituation)s, '
                 '%(betriebseinschraenkungPersonal)s, %(betriebseinschraenkungRaum)s, '
                 '%(betriebseinschraenkungBeatmungsgeraet)s, %(betriebseinschraenkungVerbrauchsmaterial)s, '
                 '%(meldebereiche)s, %(ardsNetzwerkMitglied)s, %(intensivBetten)s, %(intensivBettenBelegt)s, '
                 '%(patientenInvasivBeatmet)s, %(patientenEcmo)s, %(freieIvKapazitaet)s, %(freieEcmoKapazitaet)s, '
                 '%(intensivBettenNotfall7d)s, %(statusEinschaetzungLowcare)s, %(statusEinschaetzungHighcare)s, '
                 '%(statusEinschaetzungEcmo)s, %(behandlungsschwerpunktL1)s, %(behandlungsschwerpunktL2)s, '
                 '%(behandlungsschwerpunktL3)s, %(faelleCovidAktuellNichtInvasivBeatmet)s, %(faelleCovidAktuellEcmo)s)',
        page_size=500
    )
    conn.commit()


# read in all json files that we currently have (this can be removed in the next update):
# : After data has been inserted, this code can be removed, also remove PVC and storing data locally.
# json_files = glob.glob(STORAGE_PATH + "*.json")
#
# for j in json_files:
#     print(j)
#     with open(j) as file_content:
#         data = json.load(file_content)
#         insert_data(data)

try:
    # load the newest data into the DB to overwrite the latest data
    insert_data(data)

    cur.close()
    conn.close()

    print(subprocess.run(['fdupes', '-dN', '-o', 'name', STORAGE_PATH], capture_output=True))

    logger.info('Done. Exiting...')
except Exception as e:
    if cur:
        cur.close()
    if conn:
        conn.close()
    raise e
