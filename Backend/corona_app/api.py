import logging
from flask import Blueprint, Response, jsonify, request

from .model import *

backend_api = Blueprint('api', __name__)

logger = logging.getLogger(__name__)

@backend_api.route('/health')
def healthcheck():
    # FIXME: the database connection should be checked here!
    return "ok", 200

# Custom Rest API
@backend_api.route('/hospital', methods=['GET'])
def get_hospitals():
    """
        Return all Hospitals
    """
    hospitals = db.session.query(Hospital).all()
    results = []
    for elem in hospitals:
        results.append(elem.as_dict())
    return jsonify(results)


@backend_api.route('/hospital/<int:id>', methods=['GET'])
def get_hospital(id=None):
    """
        Return a specific hospital
        :param id: id of the specific hospital
    """
    if not id:
        return jsonify({})
    hospital = db.session.query(Hospital).filter_by(id=id)
    results = []
    for elem in hospital:
        results.append(elem.as_dict())
    return jsonify(results)


@backend_api.route('/person', methods=['GET'])
def get_persons():
    """
        Return all persons
    """
    persons = db.session.query(Person).all()
    results = []
    for elem in persons:
        results.append(elem.as_dict())
    return jsonify(results)


@backend_api.route('/person/<int:id>', methods=['GET'])
def get_person(id=None):
    """
        Return a specific person
        :param id: id of the specific person
    """
    if not id:
        return jsonify({})
    persons = db.session.query(Person).filter_by(id=id)
    results = []
    for elem in persons:
        results.append(elem.as_dict())
    return jsonify(results)


@backend_api.route('/bed', methods=['GET'])
def get_beds():
    """
        Return all beds
    """
    beds = db.session.query(Bed).all()
    results = []
    for elem in beds:
        results.append(elem.as_dict())
    return jsonify(results)


@backend_api.route('/bed/<int:id>', methods=['GET'])
def get_bed(id=None):
    """
        Return a specific bed
        :param id: id of the specific bed
    """
    if not id:
        return jsonify({})
    beds = db.session.query(Bed).filter_by(id=id)
    results = []
    for elem in beds:
        results.append(elem.as_dict())
    return jsonify(results)
