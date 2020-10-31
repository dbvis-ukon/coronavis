import os
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify

from models.counties import County, county_schema

routes = Blueprint('counties', __name__, url_prefix='/counties')


@routes.route('/', methods=['GET'])
def get():
    c = County.query.all()
    return jsonify(county_schema.dump(c, many=True))
