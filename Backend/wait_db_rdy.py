import os
from datetime import datetime, timedelta
from time import sleep
from urllib.parse import quote

import psycopg2
# noinspection PyUnresolvedReferences
import loadenv

DB_HOST = os.environ.get('DB_HOST').replace('\n', '')
DB_PORT = os.environ.get('DB_PORT').replace('\n', '')
DB_USER = os.environ.get('DB_USER').replace('\n', '')
DB_PASS = os.environ.get('DB_PASS').replace('\n', '')
DB_NAME = os.environ.get('DB_NAME').replace('\n', '')

max_timeout = 120

timeout = datetime.now() + timedelta(seconds = max_timeout)

database_up = False

print(f"Waiting max {max_timeout} seconds for the database.")

while datetime.now() <= timeout:
    try:
        conn = psycopg2.connect(f"postgresql://{quote(DB_USER, safe='')}:{quote(DB_PASS, safe='')}@{quote(DB_HOST, safe='')}:{quote(DB_PORT, safe='')}/{quote(DB_NAME, safe='')}")
        cur = conn.cursor()
        cur.execute("SELECT postgis_version()")
        print(cur.fetchone())

        database_up = True
        sleep(1)
        break
    except Exception as e:
        # DB not up
        sleep(10)
        print(e)


if not database_up:
    print("Database could not be reached.")
    exit(1)


print("Database up and running.")
exit(0)
