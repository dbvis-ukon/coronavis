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
    hospitals_aggregated = db.session.query(HospitalsPerLandkreis).all()
    return jsonify(__as_feature_collection(hospitals_aggregated)), 200


@routes.route('/regierungsbezirke', methods=['GET'])
@cache.cached()
def get_hospitals_by_regierungsbezirke():
    """
        Return all Hospitals
    """

    hospitals_aggregated = db.session.query(HospitalsPerRegierungsbezirk).all()
    return jsonify(__as_feature_collection(hospitals_aggregated)), 200


@routes.route('/bundeslander', methods=['GET'])
@cache.cached()
def get_hospitals_by_bundeslander():
    """
        Return all Hospitals
    """

    hospitals_aggregated = db.session.query(HospitalsPerBundesland).all()
    return jsonify(__as_feature_collection(hospitals_aggregated)), 200


icu = IcuDevelopments()


@routes.route('/development/<id_hospital>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_hospital(id_hospital):
    return icu.get_hospital(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'),
                            id_hospital, request.args.get('nogeom', type=bool) != True)


@routes.route('/development', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_hospitals2():
    return icu.get_hospitals(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'),
                             request.args.get('nogeom', type=bool) != True)


@routes.route('/development/landkreis/<id_county>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_county(id_county):
    return icu.get_county(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'), id_county,
                          request.args.get('nogeom', type=bool) != True)


@routes.route('/development/landkreise', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_counties():
    return icu.get_by_counties(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'),
                               request.args.get('nogeom', type=bool) != True)


@routes.route('/development/regierungsbezirk/<id_district>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_district(id_district):
    return icu.get_district(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'),
                            id_district, request.args.get('nogeom', type=bool) != True)


@routes.route('/development/regierungsbezirke', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_districts():
    return icu.get_by_districts(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'),
                                request.args.get('nogeom', type=bool) != True)


@routes.route('/development/bundesland/<id_state>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_state(id_state):
    return icu.get_state(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'), id_state,
                         request.args.get('nogeom', type=bool) != True)


@routes.route('/development/bundeslaender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_states():
    return icu.get_by_states(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'),
                             request.args.get('nogeom', type=bool) != True)


@routes.route('/development/land/<id_country>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_country(id_country):
    return icu.get_country(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'), id_country,
                           request.args.get('nogeom', type=bool) != True)


@routes.route('/development/laender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_countries():
    return icu.get_by_countries(request.args.get('from'), request.args.get('to'), request.args.get('maxDaysOld'),
                                request.args.get('nogeom', type=bool) != True)


@routes.route('/development/aggregated', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_aggregated():
    return icu.get_aggregated({
        'landkreise': request.args.get('landkreise'),
        'regierungsbezirke': request.args.get('regierungsbezirke'),
        'bundeslaender': request.args.get('bundeslaender'),
        'laender': request.args.get('laender')
    }, request.args.get('from'), request.args.get('to'), request.args.get('nogeom', type=bool) != True)
