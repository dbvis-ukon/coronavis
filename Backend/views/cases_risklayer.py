import json

from flask import Blueprint, Response, jsonify
from sqlalchemy import text

from cache import cache
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
@cache.cached()
@timer
def get_cases_development_by_counties():
    return cd.getByCounties()


@routes.route('/development/regierungsbezirke', methods=['GET'])
@cache.cached()
@timer
def get_cases_development_by_districts():
    return cd.getByDistricts()


@routes.route('/development/bundeslaender', methods=['GET'])
@cache.cached()
@timer
def get_cases_development_by_states():
    return cd.getByStates()


@routes.route('/development/laender', methods=['GET'])
@cache.cached()
@timer
def get_cases_development_by_countries():
    return cd.getByCountries()
