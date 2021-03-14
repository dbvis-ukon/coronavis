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
    return cd.get_by_counties(request.args.get('from'), request.args.get('to'))


@routes.route('/development/regierungsbezirke', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_districts():
    return cd.get_by_districts(request.args.get('from'), request.args.get('to'))


@routes.route('/development/bundeslaender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_states():
    return cd.get_by_states(request.args.get('from'), request.args.get('to'))


@routes.route('/development/laender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_countries():
    return cd.get_by_countries(request.args.get('from'), request.args.get('to'))


@routes.route('/development/landkreis/<idCounty>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_county(idCounty):
    return cd.get_county(request.args.get('from'), request.args.get('to'), idCounty)


@routes.route('/development/regierungsbezirk/<idDistrict>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_district(idDistrict):
    return cd.get_district(request.args.get('from'), request.args.get('to'), idDistrict)


@routes.route('/development/bundesland/<idState>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_state(idState):
    return cd.get_state(request.args.get('from'), request.args.get('to'), idState)


@routes.route('/development/land/<idCountry>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_country(idCountry):
    return cd.get_country(request.args.get('from'), request.args.get('to'), idCountry)


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
