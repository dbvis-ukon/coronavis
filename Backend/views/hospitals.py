from flask import Blueprint, jsonify, request

from cache import cache, make_cache_key
from db import db
from models.hospital import (Hospital, HospitalsPerBundesland,
                             HospitalsPerLandkreis,
                             HospitalsPerRegierungsbezirk)
from models.icuDevelopments import IcuDevelopments
from timer import timer
from views.helpers import __as_feature_collection

routes = Blueprint('hospitals', __name__, url_prefix='/hospitals')


@routes.route('/', methods=['GET'])
@cache.cached()
def get_hospitals():
    """
        Return all Hospitals
    """
    hospitals = db.session.query(Hospital).all()
    return jsonify(__as_feature_collection(hospitals)), 200


@routes.route('/landkreise', methods=['GET'])
@cache.cached()
def get_hospitals_by_landkreise():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(HospitalsPerLandkreis).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/regierungsbezirke', methods=['GET'])
@cache.cached()
def get_hospitals_by_regierungsbezirke():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(HospitalsPerRegierungsbezirk).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/bundeslander', methods=['GET'])
@cache.cached()
def get_hospitals_by_bundeslander():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(HospitalsPerBundesland).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


icu = IcuDevelopments()


@routes.route('/development/<idHospital>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_hospital(idHospital):
    return icu.getHospital(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'), idHospital)


@routes.route('/development', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_hospitals2():
    return icu.getHospitals(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'))


@routes.route('/development/landkreis/<idCounty>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_county(idCounty):
    return icu.getCounty(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'), idCounty)


@routes.route('/development/landkreise', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_counties():
    return icu.getByCounties(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'))


@routes.route('/development/regierungsbezirk/<idDistrict>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_district(idDistrict):
    return icu.getDistrict(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'), idDistrict)


@routes.route('/development/regierungsbezirke', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_districts():
    return icu.getByDistricts(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'))


@routes.route('/development/bundesland/<idState>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_state(idState):
    return icu.getState(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'), idState)


@routes.route('/development/bundeslaender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_states():
    return icu.getByStates(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'))


@routes.route('/development/land/<idCountry>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_country(idCountry):
    return icu.getCountry(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'), idCountry)


@routes.route('/development/laender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_countries():
    return icu.getByCountries(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'))
