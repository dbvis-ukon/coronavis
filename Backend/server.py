#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os

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
app.config.from_pyfile('config.py')
cache.init_app(app)
db.init_app(app)

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
