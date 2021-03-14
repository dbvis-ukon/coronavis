import psycopg2 as pg
import psycopg2.extensions
import psycopg2.extras

import logging
import os
from urllib.parse import quote

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

DATABASE_FILE = 'corona_app'
SQLALCHEMY_DATABASE_URI = 'postgresql://'  # Fallback to Zero

# create postgresql connection string
try:
    DB_HOST = os.environ.get('DB_HOST').replace('\n', '')
    DB_PORT = os.environ.get('DB_PORT').replace('\n', '')
    DB_USER = os.environ.get('DB_USER').replace('\n', '')
    DB_PASS = os.environ.get('DB_PASS').replace('\n', '')
    DB_NAME = os.environ.get('DB_NAME').replace('\n', '')

    if None in (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME):
        raise KeyError
    else:
        SQLALCHEMY_DATABASE_URI = f"postgresql://{quote(DB_USER, safe='')}:{quote(DB_PASS, safe='')}@{quote(DB_HOST, safe='')}:{quote(DB_PORT, safe='')}/{quote(DB_NAME, safe='')}"

    VERSION = os.environ.get('VERSION').replace('\n', '')
    ENVIRONMENT = os.environ.get('ENVIRONMENT').replace('\n', '')

except KeyError as e:
    logger.warning('One or multiple necessary environment variables not set.')
    raise e


def get_connection():
    conn = pg.connect(SQLALCHEMY_DATABASE_URI)
    conn.set_session(autocommit=False, isolation_level=psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE)
    cur = conn.cursor()
    return conn, cur
