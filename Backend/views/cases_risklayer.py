from flask import Blueprint, jsonify, request

from cache import cache, make_cache_key
from db import db
from models.caseDevelopments import CaseDevelopments
from timer import timer

routes = Blueprint('cases-risklayer', __name__, url_prefix='/cases-risklayer')

cd = CaseDevelopments('cases_per_county_and_day_risklayer')


@routes.route('/development/landkreise', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_counties():
    if request.args.get('nogeom') == 'true':
        cd.set_want_geom(False)
    return cd.get_by_counties(request.args.get('from'), request.args.get('to'), False)


@routes.route('/development/regierungsbezirke', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_districts():
    if request.args.get('nogeom') == 'true':
        cd.set_want_geom(False)
    return cd.get_by_districts(request.args.get('from'), request.args.get('to'), False)


@routes.route('/development/bundeslaender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_states():
    if request.args.get('nogeom') == 'true':
        cd.set_want_geom(False)
    return cd.get_by_states(request.args.get('from'), request.args.get('to'), False)


@routes.route('/development/laender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_countries():
    if request.args.get('nogeom') == 'true':
        cd.set_want_geom(False)
    return cd.get_by_countries(request.args.get('from'), request.args.get('to'), False)


@routes.route('/development/landkreis/<id_county>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_county(id_county):
    if request.args.get('nogeom') == 'true':
        cd.set_want_geom(False)
    return cd.get_county(request.args.get('from'), request.args.get('to'), id_county, False)


@routes.route('/development/regierungsbezirk/<id_district>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_district(id_district):
    if request.args.get('nogeom') == 'true':
        cd.set_want_geom(False)
    return cd.get_district(request.args.get('from'), request.args.get('to'), id_district, False)


@routes.route('/development/bundesland/<id_state>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_state(id_state):
    if request.args.get('nogeom') == 'true':
        cd.set_want_geom(False)
    return cd.get_state(request.args.get('from'), request.args.get('to'), id_state, False)


@routes.route('/development/land/<id_country>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_country(id_country):
    if request.args.get('nogeom') == 'true':
        cd.set_want_geom(False)
    return cd.get_country(request.args.get('from'), request.args.get('to'), id_country, False)


@routes.route('/development/aggregated', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_aggregated():
    if request.args.get('nogeom') == 'true':
        cd.set_want_geom(False)
    return cd.get_aggregated({
        'landkreise': request.args.get('landkreise'),
        'regierungsbezirke': request.args.get('regierungsbezirke'),
        'bundeslaender': request.args.get('bundeslaender'),
        'laender': request.args.get('laender')
    }, request.args.get('from'), request.args.get('to'), False)


@routes.route('/prognosis', methods=['GET'])
@cache.cached()
def get_prognosis():
    """
        Returns the prognosis of Risklayer
    """

    sql_stmt = '''
        SELECT * 
        FROM risklayer_prognosis
        WHERE datenbestand = (
            SELECT MAX(datenbestand) FROM risklayer_prognosis
        )
    '''
    res = db.engine.execute(sql_stmt).fetchone()

    ret = {
        "timestamp": res[0],
        "prognosis": res[1]
    }

    return jsonify(ret), 200
