from flask import Blueprint, jsonify

from cache import cache
from db import db
from models.divi import HospitalDevelopment, HospitalsDevelopmentPerLandkreis, HospitalsDevelopmentPerBundesland, \
    HospitalsDevelopmentPerRegierungsbezirk
from views.helpers import __as_feature_collection

routes = Blueprint('divi', __name__, url_prefix='/divi')


@routes.route('current', methods=['GET'])
@cache.cached()
def get_hospitals_current():
    """
        Return all Hospitals Developments
    """
    hospitals = db.session.query(HospitalDevelopment).all()
    return jsonify(__as_feature_collection(hospitals)), 200


@routes.route('/development', methods=['GET'])
@cache.cached()
def get_hospitals_development():
    """
        Return all Hospitals Developments
    """
    hospitals = db.session.query(HospitalDevelopment).all()
    return jsonify(__as_feature_collection(hospitals)), 200


@routes.route('/development/landkreise', methods=['GET'])
@cache.cached()
def get_hospitals_development_landkreise():
    """
        Return all Hospitals Developments
    """
    hospitals = db.session.query(HospitalsDevelopmentPerLandkreis).all()
    return jsonify(__as_feature_collection(hospitals)), 200


@routes.route('/development/regierungsbezirke', methods=['GET'])
@cache.cached()
def get_hospitals_development_regierungsbezirke():
    """
        Return all Hospitals Developments
    """
    hospitals = db.session.query(HospitalsDevelopmentPerRegierungsbezirk).all()
    return jsonify(__as_feature_collection(hospitals)), 200


@routes.route('/development/bundeslaender', methods=['GET'])
@cache.cached()
def get_hospitals_development_bundeslaender():
    """
        Return all Hospitals Developments
    """
    hospitals = db.session.query(HospitalsDevelopmentPerBundesland).all()
    return jsonify(__as_feature_collection(hospitals)), 200
