import logging
import os

from flask import Blueprint, jsonify


routes = Blueprint('version', __name__, url_prefix='/version/')

@routes.route('')
def versioncheck():
    VERSION = os.environ.get('VERSION')
    if not VERSION:
        VERSION = 'development'

    return VERSION, 200

