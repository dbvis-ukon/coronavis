import logging
from flask import Blueprint, Response, jsonify, request

backend_api = Blueprint('api', __name__)

logger = logging.getLogger(__name__)

@backend_api.route("/")
def test():
    return 'Hello World'