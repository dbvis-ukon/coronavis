#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
# noinspection PyUnresolvedReferences
from datetime import datetime

from flasgger import Swagger
from flask import Flask, jsonify, redirect
from flask_compress import Compress
from flask_cors import CORS, cross_origin
from flask_mail import Mail
from flask_marshmallow import Marshmallow
from werkzeug.exceptions import HTTPException

from cache import cache
from db import db
from prometheus import metrics
from views import (cases, cases_risklayer, divi, extent, health, hospitals,
                   osm, version, email_subs, counties, regions, dashboards, ebrake)

# add sentry integration


# Create Flask application
app = Flask(__name__)
metrics.init_app(app)

# static information as metric
# metrics.info('app_info', 'Application info', version=os.getenv('VERSION'), environment=os.getenv('ENVIRONMENT'))
app.url_map.strict_slashes = False

swagger = Swagger(app)
# app.config['SWAGGER']['openapi'] = '3.0.2'

VERSION = os.environ.get('VERSION').replace('\n', '') if os.environ.get('VERSION') else ''
ENVIRONMENT = os.environ.get('ENVIRONMENT').replace('\n', '') if os.environ.get('ENVIRONMENT') else 'development'

if os.environ.get('SENTRY_DSN') is not None:
    import sentry_sdk
    from sentry_sdk.integrations.flask import FlaskIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

    SENTRY_DSN = os.environ.get('SENTRY_DSN').replace('\n', '')
    sentry_sdk.init(
        environment=ENVIRONMENT,
        release=VERSION,
        dsn=SENTRY_DSN,
        integrations=[FlaskIntegration(), SqlalchemyIntegration()])
else:
    app.logger.warning('No SENTRY_DSN environment variable set, will not report errors to sentry.io')

try:
    DB_HOST = os.environ.get('DB_HOST')
    DB_PORT = os.environ.get('DB_PORT')
    DB_USER = os.environ.get('DB_USER')
    DB_PASS = os.environ.get('DB_PASS')
    DB_NAME = os.environ.get('DB_NAME')

    if None in (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME):
        raise KeyError
    else:
        # why? i don't know but its necessary
        DB_PASS = DB_PASS.replace('\n', '').replace('\r', '')
        DB_CONNECTION_STRING = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?application_name=coronavis_backend_{ENVIRONMENT}_{VERSION}"

except KeyError as e:
    app.logger.warning('One or multiple necessary environment variables not set, using config.py file as backup')
    exit(1)
    # DB_CONNECTION_STRING = config.SQLALCHEMY_DATABASE_URI

SQL_POOL_SIZE = 2
SQL_MAX_OVERFLOW = 8

if ENVIRONMENT == 'production':
    SQL_POOL_SIZE = 10
    SQL_MAX_OVERFLOW = 50

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# noinspection PyUnboundLocalVariable
app.config['SQLALCHEMY_DATABASE_URI'] = DB_CONNECTION_STRING
app.config['SQLALCHEMY_ECHO'] = os.getenv('DEBUG') == 'true'
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {"pool_size": SQL_POOL_SIZE, "max_overflow": SQL_MAX_OVERFLOW, 'pool_use_lifo': True, 'pool_pre_ping': True}
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = os.getenv('MAIL_PORT')
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEBUG'] = True

db.init_app(app)
cache.init_app(app)
# add cors and compress
CORS(app)
Compress(app)
mail = Mail(app)
ma = Marshmallow(app)


@cross_origin()
@app.errorhandler(HTTPException)
def handle_http_exception(ex):
    """Return JSON instead of HTML for HTTP errors."""
    # start with the correct headers and status code from the error
    response = ex.get_response()
    # replace the body with JSON
    response.data = json.dumps({
        "code": ex.code,
        "name": ex.name,
        "description": ex.description,
    })
    response.content_type = "application/json"
    return response


@cross_origin()
@app.errorhandler(Exception)
def handle_exception(ex):
    # pass through HTTP errors
    if isinstance(ex, HTTPException):
        return ex

    app.logger.error(ex)

    # now you're handling non-HTTP exceptions only
    return jsonify({
        "code": 500,
        "name": "Internal Server Error",
        "description": str(ex.message) if hasattr(ex, 'message') else str(ex).partition('\n')[0]
    }), 500


# register blueprints
app.register_blueprint(cases.routes)
app.register_blueprint(health.routes)
app.register_blueprint(hospitals.routes)
app.register_blueprint(osm.routes)
app.register_blueprint(version.routes)
app.register_blueprint(divi.routes)
app.register_blueprint(cases_risklayer.routes)
app.register_blueprint(extent.routes)
app.register_blueprint(email_subs.routes)
app.register_blueprint(counties.routes)
app.register_blueprint(regions.routes)
app.register_blueprint(dashboards.routes)
app.register_blueprint(ebrake.routes)


@app.route('/', methods=['GET'])
def redirect_to_apidocs():
    return redirect("/apidocs", code=302)


if __name__ == "__main__":
    app.run(port=5000, debug=os.environ.get("DEBUG", '') == 'true' or False)
