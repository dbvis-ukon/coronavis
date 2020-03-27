import os

from flask import Blueprint

routes = Blueprint('version', __name__, url_prefix='/version/')


@routes.route('', strict_slashes=False)
def versioncheck():
    version = os.environ.get('VERSION')
    if not version:
        version = 'development'

    return version, 200
