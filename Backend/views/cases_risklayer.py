from flask import Blueprint, jsonify, request

from cache import cache, make_cache_key
from db import db
from models.caseDevelopments import CaseDevelopments
from timer import timer

routes = Blueprint('cases-risklayer', __name__, url_prefix='/cases-risklayer')

cd = CaseDevelopments('cases_per_county_and_day_risklayer')


@routes.route('/development/landkreise', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_cases_development_by_counties():
    return cd.getByCounties(request.args.get('from'), request.args.get('to'))


@routes.route('/development/regierungsbezirke', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_cases_development_by_districts():
    return cd.getByDistricts(request.args.get('from'), request.args.get('to'))


@routes.route('/development/bundeslaender', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_cases_development_by_states():
    return cd.getByStates(request.args.get('from'), request.args.get('to'))


@routes.route('/development/laender', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_cases_development_by_countries():
    return cd.getByCountries(request.args.get('from'), request.args.get('to'))


@routes.route('/development/landkreis/<idCounty>', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_county(idCounty):
    return cd.getCounty(request.args.get('from'), request.args.get('to'), idCounty)


@routes.route('/development/regierungsbezirk/<idDistrict>', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_district(idDistrict):
    return cd.getDistrict(request.args.get('from'), request.args.get('to'), idDistrict)


@routes.route('/development/bundesland/<idState>', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_state(idState):
    return cd.getState(request.args.get('from'), request.args.get('to'), idState)


@routes.route('/development/land/<idCountry>', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_country(idCountry):
    return cd.getCountry(request.args.get('from'), request.args.get('to'), idCountry)


@routes.route('/development/aggregated', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_aggregated():
    return cd.getAggregated({
        'landkreise': request.args.get('landkreise'),
        'regierungsbezirke': request.args.get('regierungsbezirke'),
        'bundeslaender': request.args.get('bundeslaender'),
        'laender': request.args.get('laender')
    },request.args.get('from'), request.args.get('to'))


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
