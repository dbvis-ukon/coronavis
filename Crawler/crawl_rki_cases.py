#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer
import csv
import datetime
import getopt
import json
import logging
import sys
from datetime import date
from io import StringIO
from lzma import LZMADecompressor, FORMAT_AUTO, LZMAError
from typing import List, Dict, Tuple

import jsonschema
import psycopg2 as pg
import pytz
import requests

# noinspection PyUnresolvedReferences
import loadenv
from db_config import get_connection, retry_refresh, retry_execute_values
from utils import get_execution_time, get_start

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

logger.info('Crawler for RKI detailed case data')

conn, cur = get_connection('crawl_rki_cases')

cur.execute(
    "SELECT MAX(datenbestand), COUNT(*) as c FROM cases WHERE datenbestand = (SELECT MAX(datenbestand) FROM cases)")
r = cur.fetchone()
last_update: datetime.datetime = r[0]
num_cases_in_db: int = r[1]

today = datetime.datetime.now(tz=pytz.timezone('Europe/Berlin')).replace(hour=0, minute=0, second=0, microsecond=0)

opts, _ = getopt.getopt(sys.argv[1:], 'o', ['override'])
override = False
for opt, arg in opts:
    if opt in ("-o", "--override"):
        override = True

if last_update is not None and last_update >= today and override is False:
    logger.info('Data seems to be up to date (Database: %s, Today: %s). Won\'t fetch.', last_update, date.today())
    cur.close()
    conn.close()
    exit(0)

# close db connection here because data downloading and parsing takes too long
cur.close()
conn.close()


def try_parse_int(s: str) -> int | str:
    try:
        return int(s)
    except ValueError:
        return s


URL = 'https://github.com/robert-koch-institut/SARS-CoV-2-Infektionen_in_Deutschland_Archiv/blob/main/Archiv/%TODAY%_Deutschland_SarsCov2_Infektionen.csv.xz?raw=true'

def decompress_lzma(data: bytes) -> bytes:
    """
    Taken from: https://stackoverflow.com/a/37400585/1986417
    """
    results = []
    while True:
        decomp = LZMADecompressor(FORMAT_AUTO, None, None)
        try:
            res = decomp.decompress(data)
        except LZMAError:
            if results:
                break  # Leftover data is not a valid LZMA/XZ stream; ignore it.
            else:
                raise  # Error on the first iteration; bail out.
        results.append(res)
        data = decomp.unused_data
        if not data:
            break
        if not decomp.eof:
            raise LZMAError("Compressed data ended before the end-of-stream marker was reached")
    return b"".join(results)

def download_data() -> Tuple[List[Dict[str, int | str]], datetime.datetime] | None:
    today_str = today.strftime('%Y-%m-%d')
    url = URL.replace('%TODAY%', today_str)
    logger.info(f'download data {url}')
    # urllib.request.urlretrieve(url, './rki_cases.csv.xz')
    start = get_start()
    response = requests.get(url)
    if response.status_code == 404:
        logger.warning(f'No data available for {today_str}')
        exit(0)

    decompressed_bytes = decompress_lzma(response.content)

    # some weird tokens at the beginning of the file, this gets rid of it
    buff = StringIO(decompressed_bytes.decode('utf-8')[3:])
    # lines = [line.decode('utf-8') for line in response.readlines()]
    data = []
    max_meldedatum: datetime.datetime = datetime.datetime.now() - datetime.timedelta(days=365)
    for row in csv.DictReader(buff, skipinitialspace=True):
        # print(row)
        row = {k: try_parse_int(v) if k != 'Landkreis' else '{:05d}'.format(int(v)) for k, v in row.items()}
        m = datetime.datetime.fromisoformat(row['Meldedatum'])
        if max_meldedatum is None or m > max_meldedatum:
            max_meldedatum = m
        row['IdLandkreis'] = row['Landkreis']
        data.append(row)

    with open('./rki-test.csv', mode='w', newline='') as f:  # You will need 'wb' mode in Python 2.x
        w = csv.DictWriter(f, data[0].keys())
        w.writeheader()
        for row in data:
            w.writerow(row)

    logger.info(f'took {get_execution_time(start)}')
    return data, max_meldedatum


def validate_data(data: List[Dict[str, int | str]]) -> bool:
    start = get_start()
    logger.info('validate json data with schema')
    with open('./rki_cases.schema.json') as schema:
        jsonschema.validate(data, json.load(schema))
        logger.info(f'took {get_execution_time(start)}')
        return True


def parse_data(data: List[Dict[str, int | str]]) -> \
        List[Dict[str, int | str | datetime.datetime]]:
    start = get_start()
    logger.info('parse data')
    entries = []
    for el in data:
        cc = ['case' for _ in range(el['AnzahlFall'])]
        cc.extend(['death' for _ in range(el['AnzahlTodesfall'])])
        entry = [{
            'datenbestand': today,
            'idlandkreis': el['IdLandkreis'],
            # 'meldedatum': datetime.datetime.utcfromtimestamp(el['Meldedatum'] / 1000),
            'meldedatum': datetime.datetime.fromisoformat(el['Meldedatum']),
            # 'refdatum': datetime.datetime.utcfromtimestamp(el['Refdatum'] / 1000),
            'refdatum': datetime.datetime.fromisoformat(el['Refdatum']),
            'gender': el['Geschlecht'],
            'agegroup': el['Altersgruppe'],
            'casetype': casetype
        } for casetype in cc]
        entries.extend(entry)
    logger.debug('current entries: %s', len(entries))
    logger.info(f'took {get_execution_time(start)}')
    return entries


def load_data_into_db(entries: List[Dict[str, int | str | datetime.datetime]]):
    start = get_start()
    aquery = 'INSERT INTO cases(datenbestand, idlandkreis, meldedatum, gender, agegroup, casetype, refdatum) VALUES %s'
    conn2, cur2 = None, None
    try:
        # reconnect to DB here
        conn2, cur2 = get_connection('crawl_rki_cases')

        current_update: datetime.datetime = entries[0]['datenbestand'].replace(tzinfo=pytz.timezone('Europe/Berlin'))

        logger.info("db data version: %s", last_update)
        logger.info("fetched data version: %s", current_update)
        logger.info("Num entries in DB %s, num entries fetched %s, diff %s", num_cases_in_db, len(entries),
                    len(entries) - num_cases_in_db)

        if last_update is not None and abs(
                (current_update - last_update).total_seconds()) <= 2 * 60 * 60 and override is False:
            logger.info("No new data available (+/- 2h), skip update")
            exit(0)
        elif len(entries) < (num_cases_in_db - 1000):
            # when we have less entries fetched than we already have in the DB the RKI API probably did not return all cases
            logger.error("RKI API data blob is incomplete. Will fail this job and try again at next crawl time.")
            exit(2)
        elif (len(entries) - num_cases_in_db) > 500000 and override is False:
            logger.error(
                "{} new entries in a single update (> 500k). Seems RKI API data blob is errornous. Will fail this job and try again at next crawl time.".format(
                    (len(entries) - num_cases_in_db)))
            exit(2)
        else:
            logger.info('insert new data into DB')

            retry_execute_values(
                conn=conn2,
                cur=cur2,
                query=aquery,
                template='(%(datenbestand)s, %(idlandkreis)s, %(meldedatum)s, %(gender)s, %(agegroup)s, %(casetype)s, %(refdatum)s)',
                entries=entries,
                page_size=500
            )
            logger.info('Data inserted.')
            logger.info(f'took {get_execution_time(start)}')


            logger.info('remove old data')
            retry_refresh(
                conn=conn2,
                cur=cur2,
                query=f'DELETE FROM cases WHERE datenbestand < \'{current_update}\'::date;'
            )
            logger.info('old data removed.')
            logger.info(f'took {get_execution_time(start)}')


            start = get_start()
            logger.info('Refreshing materialized view.')

            retry_refresh(
                conn=conn2,
                cur=cur2,
                query='set time zone \'UTC\'; REFRESH MATERIALIZED VIEW CONCURRENTLY cases_per_county_and_day;'
            )

            logger.info('Success')

            if conn2:
                cur2.close()
                conn2.close()

            logger.info(f'took {get_execution_time(start)}')

            exit(0)
    except (Exception, pg.DatabaseError) as error:
        logger.error(error)
        logger.error("Error in transction - Reverting all other operations of a transction")
        logger.error("Most likely a simultanious update was applied faster.")

        conn2.rollback()

        if conn2:
            cur2.close()
            conn2.close()

        exit(1)


d, max_md = download_data()
validate_data(d)
e = parse_data(d)
load_data_into_db(e)
