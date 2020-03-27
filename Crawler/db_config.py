DATABASE_FILE = 'corona_app'
SQLALCHEMY_DATABASE_URI = 'postgresql://' # 'postgresql://corona:KbN%7CrjlN5f%2F.QU8EfP@db.dbvis.de/coronadb'  # + DATABASE_FILE
SQLALCHEMY_ECHO = True

import os
import logging

from urllib.parse import quote

logger = logging.getLogger(__name__)

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
        SQLALCHEMY_DATABASE_URI = f"postgresql://{quote(DB_USER)}:{quote(DB_PASS)}@{quote(DB_HOST)}:{quote(DB_PORT)}/{quote(DB_NAME)}"
except KeyError as e:
    logger.warning('One or multiple necessary environment variables not set, using config.py file as backup')

