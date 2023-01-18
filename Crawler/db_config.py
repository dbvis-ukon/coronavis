import time
from typing import Optional, Any

# import psycopg2
from psycopg2 import connect
from psycopg2.extensions import cursor, connection, ISOLATION_LEVEL_SERIALIZABLE

import logging
import os
from urllib.parse import quote

import sentry_sdk
from psycopg2.extras import execute_values
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

DATABASE_FILE = 'corona_app'
SQLALCHEMY_DATABASE_URI = 'postgresql://'  # Fallback to Zero
SQLALCHEMY_ECHO = True

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

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

    SENTRY_DSN = None
    if os.environ.get('SENTRY_DSN') is not None:
        SENTRY_DSN = os.environ.get('SENTRY_DSN').replace('\n', '')
    VERSION = os.environ.get('VERSION').replace('\n', '')
    ENVIRONMENT = os.environ.get('ENVIRONMENT').replace('\n', '')
    sentry_sdk.init(
        environment=ENVIRONMENT,
        release=VERSION,
        dsn=SENTRY_DSN,
        integrations=[SqlalchemyIntegration()]
    )

except KeyError as e:
    logger.warning('One or multiple necessary environment variables not set.')
    raise e


def get_connection(application_name: Optional[str] = None) -> tuple[connection, cursor]:
    conn: connection = connect(SQLALCHEMY_DATABASE_URI)
    conn.set_session(autocommit=False, isolation_level=ISOLATION_LEVEL_SERIALIZABLE)
    cur: cursor = conn.cursor()
    if application_name is not None:
        cur.execute(f"set application_name = {application_name}")
    return conn, cur


def retry_refresh(conn: connection, cur: cursor, query: str, retry: int = 5):
    num_try = 1
    while num_try <= retry:
        try:
            cur.execute(query)
            conn.commit()
            break
        except Exception as ex:
            conn.rollback()
            if "could not serialize access due to concurrent" in str(ex):
                logger.warning(f'{type(ex)}: {ex}Will retry in {num_try * 60} seconds')
                time.sleep(num_try * 60)
                num_try += 1
                continue
            else:
                raise ex

    if num_try >= retry:
        raise Exception(f'Query "{query}" failed after {retry} retries')

    logger.info(f'Query successfully executed after {num_try} tries')


def retry_execute_values(
        conn: connection,
        cur: cursor,
        query: str,
        template: str,
        entries: Any,
        page_size: int = 500,
        retry: int = 5) -> None:
    num_try = 1
    while num_try <= retry:
        try:
            execute_values(
                cur=cur,
                sql=query,
                template=template,
                argslist=entries,
                page_size=page_size
            )
            conn.commit()
            break
        except Exception as ex:
            conn.rollback()
            if "could not serialize access due to concurrent" in str(ex):
                logger.warning(f'{type(ex)}: {ex}Will retry in {num_try * 60} seconds')
                time.sleep(num_try * 60)
                num_try += 1
                continue
            else:
                raise ex

    if num_try >= retry:
        raise Exception(f'Query "{query}" failed after {retry} retries')

    logger.info(f'Query successfully executed after {num_try} tries')
