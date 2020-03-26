import logging

from flask import Blueprint, jsonify

from db import db

routes = Blueprint('health', __name__, url_prefix='/health')

@routes.route('/')
def healthcheck():
    is_database_working = True
    output = 'database is ok'

    try:
        # to check database we will execute raw query
        db.engine.execute('select 1 as is_alive;').fetchall()
    except Exception as e:
        output = 'database is not ok, see logs for more information'
        is_database_working = False
        logging.error(str(e))

    return jsonify((is_database_working, output)), 200 if is_database_working else 500