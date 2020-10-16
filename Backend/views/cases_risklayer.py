import json

from flask import Blueprint, Response, jsonify, request
from sqlalchemy import text

from cache import cache, make_cache_key
from db import db
from models.cases import (
    CasesPerBundesland3DaysBefore, CasesPerBundeslandToday,
    CasesPerBundeslandYesterday, CasesPerLandkreis3DaysBefore,
    CasesPerLandkreisToday, CasesPerLandkreisYesterday,
    CasesPerRegierungsbezirk3DaysBefore, CasesPerRegierungsbezirkToday,
    CasesPerRegierungsbezirkYesterday)
from timer import timer
from views.helpers import __as_feature_collection

from models.caseDevelopments import CaseDevelopments

routes = Blueprint('cases-risklayer', __name__, url_prefix='/cases-risklayer')

cd = CaseDevelopments('cases_per_county_and_day_risklayer')


@routes.route('/development/landkreise', methods=['GET'])
@cache.cached(key_prefix = make_cache_key)
@timer
def get_cases_development_by_counties():
    return cd.getByCounties(request.args.get('from'), request.args.get('to'))


@routes.route('/development/regierungsbezirke', methods=['GET'])
@cache.cached(key_prefix = make_cache_key)
@timer
def get_cases_development_by_districts():
    return cd.getByDistricts(request.args.get('from'), request.args.get('to'))


@routes.route('/development/bundeslaender', methods=['GET'])
@cache.cached(key_prefix = make_cache_key)
@timer
def get_cases_development_by_states():
    return cd.getByStates(request.args.get('from'), request.args.get('to'))


@routes.route('/development/laender', methods=['GET'])
@cache.cached(key_prefix = make_cache_key)
@timer
def get_cases_development_by_countries():
    return cd.getByCountries(request.args.get('from'), request.args.get('to'))


@routes.route('/development/landkreis/<idCounty>', methods=['GET'])
@cache.cached(key_prefix = make_cache_key)
@timer
def get_county(idCounty):
    return cd.getCounty(request.args.get('from'), request.args.get('to'), idCounty)


@routes.route('/development/regierungsbezirk/<id>', methods=['GET'])
@cache.cached(key_prefix = make_cache_key)
@timer
def get_district():
    return cd.getDistrict(request.args.get('from'), request.args.get('to'), request.view_args['id'])


@routes.route('/development/bundesland/<id>', methods=['GET'])
@cache.cached(key_prefix = make_cache_key)
@timer
def get_state():
    return cd.getState(request.args.get('from'), request.args.get('to'), request.view_args['id'])


@routes.route('/development/land/<id>', methods=['GET'])
@cache.cached(key_prefix = make_cache_key)
@timer
def get_country():
    return cd.getCountry(request.args.get('from'), request.args.get('to'), request.view_args['id'])
