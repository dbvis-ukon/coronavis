#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
from urllib.parse import quote

from flask import Flask
from flask_compress import Compress
from flask_cors import CORS

from views import cases
from views import health
from views import hospitals
from views import osm

from db import db
from cache import cache

# Create Flask application
app = Flask(__name__)

try:
    DB_HOST = os.environ.get('DB_HOST')
    DB_PORT = os.environ.get('DB_PORT')
    DB_USER = os.environ.get('DB_USER')
    DB_PASS = os.environ.get('DB_PASS')
    DB_NAME = os.environ.get('DB_NAME')

    if None in (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME):
        raise KeyError
    else:
        DB_CONNECTION_STRING = f"postgresql://{quote(DB_USER)}:{quote(DB_PASS)}@{quote(DB_HOST)}:{quote(DB_PORT)}/{quote(DB_NAME)}"
except KeyError as e:
    logger.warning('One or multiple necessary environment variables not set, using config.py file as backup')

app.config['SQLALCHEMY_DATABASE_URI'] = DB_CONNECTION_STRING

db.init_app(app)
cache.init_app(app)

# register blueprints
app.register_blueprint(cases.routes)
app.register_blueprint(health.routes)
app.register_blueprint(hospitals.routes)
app.register_blueprint(osm.routes)

# add cors and compress
CORS(app)
Compress(app)

if __name__ == "__main__":
    app.run(port=5000, debug=True)
