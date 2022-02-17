#!/usr/bin/env python
# coding: utf-8
# author: Max Fischer
import csv
import getopt
import json
import math
import sys
import datetime
import logging
from datetime import date
from io import StringIO
from typing import List, Dict, Tuple

import jsonschema
import psycopg2 as pg
import psycopg2.extras
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

cur.execute("select max(datenbestand) from cases")
last_update: datetime.datetime = cur.fetchone()[0]

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


URL = 'https://media.githubusercontent.com/media/robert-koch-institut/SARS-CoV-2_Infektionen_in_Deutschland/master/Aktuell_Deutschland_SarsCov2_Infektionen.csv'


def download_data(url: str) -> Tuple[List[Dict[str, int | str]], datetime.datetime]:
    logger.info('download data')
    start = get_start()
    response = requests.get(url)
    # some weird tokens at the beginning of the file, this gets rid of it
    buff = StringIO(response.text[3:])
    # lines = [line.decode('utf-8') for line in response.readlines()]
    data = []
    max_meldedatum: datetime.datetime = datetime.datetime.now() - datetime.timedelta(days=365)
    for row in csv.DictReader(buff, skipinitialspace=True):
        row = {k: try_parse_int(v) if k != 'IdLandkreis' else v for k, v in row.items()}
        m = datetime.datetime.fromisoformat(row['Meldedatum'])
        if max_meldedatum is None or m > max_meldedatum:
            max_meldedatum = m
        data.append(row)

    with open('./rki-test.csv', mode='w', newline='') as f:  # You will need 'wb' mode in Python 2.x
        w = csv.DictWriter(f, data[0].keys())
        w.writeheader()
        for r in data:
            w.writerow(r)

    logger.info(f'took {get_execution_time(start)}')
    return data, max_meldedatum


def validate_data(data: List[Dict[str, int | str]]) -> bool:
    start = get_start()
    logger.info('validate json data with schema')
    with open('./rki_cases.schema.json') as schema:
        jsonschema.validate(data, json.load(schema))
        logger.info(f'took {get_execution_time(start)}')
        return True


def parse_data(data: List[Dict[str, int | str]], max_meldedatum: datetime) -> \
        List[Dict[str, int | str | datetime.datetime]]:
    start = get_start()
    logger.info('parse data')
    entries = []
    for el in data:
        cc = ['case' for _ in range(el['AnzahlFall'])]
        cc.extend(['death' for _ in range(el['AnzahlTodesfall'])])
        entry = [{
            'datenbestand': max_meldedatum,
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

        cur2.execute("SELECT COUNT(*) FROM cases WHERE datenbestand = (SELECT MAX(datenbestand) FROM cases)")
        num_cases_in_db = cur2.fetchone()[0]

        current_update: datetime.datetime = entries[0]['datenbestand'].replace(tzinfo=pytz.timezone('Europe/Berlin'))

        logger.info("db data version: %s", last_update)
        logger.info("fetched data version: %s", current_update)
        logger.info("Num entries in DB %s, num entries fetched %s", num_cases_in_db, len(entries))

        if last_update is not None and abs(
                (current_update - last_update).total_seconds()) <= 2 * 60 * 60 and override is False:
            logger.info("No new data available (+/- 2h), skip update")
            exit(0)
        elif len(entries) < (num_cases_in_db - 1000):
            # when we have less entries fetched than we already have in the DB the RKI API probably did not return all cases
            logger.error("RKI API data blob is incomplete. Will fail this job and try again at next crawl time.")
            exit(2)
        elif (len(entries) - num_cases_in_db) > 5000000:
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


d, max_md = download_data(URL)
validate_data(d)
e = parse_data(d, max_md)
load_data_into_db(e)
