#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer

import os
import sys
import logging
import requests
import re
import json
from datetime import datetime, timezone

#logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


logger = logging.getLogger(__name__)
logger.info('Crawler for divi private data')

STORAGE_PATH = "/var/divi_private/"

#USERNAME = os.environ.get('DIVI_USERNAME').replace('\n', '')
#PASSWORD = os.environ.get('DIVI_PASSWORD').replace('\n', '')

URL_LOGIN = "https://auth.intensivregister.de/auth/realms/intensivregister/protocol/openid-connect/auth?client_id=intensivregister-frontend&redirect_uri=https%3A%2F%2Fwww.intensivregister.de%2F%23%2Findex&response_mode=fragment&response_type=code&scope=openid"
URL_AUTH = "" # will be provided dynamically below
URL_STARTPAGE = "" # will be provided dynamically below
URL_TOKEN = "https://auth.intensivregister.de/auth/realms/intensivregister/protocol/openid-connect/token"
URL_API = "https://www.intensivregister.de/api/intensivregister"
URL_LOGOUT = "https://auth.intensivregister.de/auth/realms/intensivregister/protocol/openid-connect/logout?redirect_uri=https%3A%2F%2Fwww.intensivregister.de"

#payload = { "criteria": 
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
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4298.4 Safari/537.36'
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
URL_AUTH = m.group(1)
URL_AUTH = URL_AUTH.replace('&amp;', '&')
logger.info(f'auth url {URL_AUTH}')

# try to log in
logger.info('Try logging in...')
r_auth = session.post(URL_AUTH, data=auth_data, allow_redirects=False) # allow_redirect false to allow cookie storage

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
r_token = session.post(URL_TOKEN, data=token_data, allow_redirects=False) # allow_redirect false to allow cookie storage
token_data = r_token.json()

# prepare bearer token
headers = {
    'Content-Type': 'application/json',
    'authorization': f"bearer {token_data['access_token']}"
}
session.headers.update(headers)

logger.info('Assembling bearer and downloading data...')
# get private api data
x = session.post(URL_API, json = {})
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
if os.name == 'nt': # debug only
    STORAGE_PATH = './'
if not os.path.isdir(STORAGE_PATH):
    logger.error(f"Storage path {STORAGE_PATH} does not appear to be a valid directory")
    exit(1)
current_update = datetime.now(timezone.utc)
filepath = STORAGE_PATH + current_update.strftime("divi-%Y-%m-%dT%H-%M-%S") + '.json'

logger.info(f'Storing data on pvc: {filepath}')
with open(filepath, 'w') as outfile:
    json.dump(data, outfile)


#
# handle data TODO
#
logger.warning(f'Now handle data... TODO')



