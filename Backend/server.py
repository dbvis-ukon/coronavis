#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import atexit
from flask import Flask, render_template, jsonify, make_response
from flask_compress import Compress
from flask_cors import CORS

from corona_app.api import backend_api
from corona_app.model import *

# Create Flask application
app = Flask(__name__)
app.config.from_pyfile('config.py')
db.init_app(app)

# Register Blueprints
app.register_blueprint(backend_api)

CORS(app)
Compress(app)

# defining function to run on shutdown
def close_running_threads():
    db.session.remove()

# Register the function to be called on exit
atexit.register(close_running_threads)

if __name__ == "__main__":
    app.run(port=8000, debug=True)