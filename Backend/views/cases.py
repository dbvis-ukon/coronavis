import json

from flask import Blueprint, Response, jsonify, request

from cache import cache, make_cache_key
from db import db
from models.caseDevelopments import CaseDevelopments
from models.cases import (
    CasesPerBundesland3DaysBefore, CasesPerBundeslandToday,
    CasesPerBundeslandYesterday, CasesPerLandkreis3DaysBefore,
    CasesPerLandkreisToday, CasesPerLandkreisYesterday,
    CasesPerRegierungsbezirk3DaysBefore, CasesPerRegierungsbezirkToday,
    CasesPerRegierungsbezirkYesterday)
from timer import timer
from views.helpers import __as_feature_collection

routes = Blueprint('cases', __name__, url_prefix='/cases')


@routes.route('/landkreise', methods=['GET'])
@cache.cached()
def get_cases_by_landkreise_per_day():
    """
        Return all Hospitals
    """

    sql_stmt = '''
with cases_landkreise as (
	select case when idlandkreis like '11___' then '11000' else idlandkreis end, DATE(meldedatum) as "date", SUM(case when casetype = 'case' then 1 else 0 end) as cases, SUM(case when casetype = 'death' then 1 else 0 end) as deaths
	from cases_current
	group by idlandkreis, DATE(meldedatum)
)
select vk.sn_l, vk.sn_r, vk.sn_k, vk.gen, JSON_AGG(JSON_BUILD_OBJECT('date', c."date" , 'cases', c.cases, 'deaths', c.deaths) ORDER by c."date") as cases, ST_AsGeoJSON(ST_MakeValid(st_simplifyPreserveTopology(ST_union(vk.geom), 0.005))) as outline
from vg250_krs vk join cases_landkreise c on vk.ags = c.idlandkreis
group by vk.sn_l, vk.sn_r, vk.sn_k, vk.gen 
    '''
    sql_result = db.engine.execute(sql_stmt)

    d, features = {}, []
    for row in sql_result:
        for column, value in row.items():
            # build up the dictionary
            d = {**d, **{column: value}}

        feature = {
            "type": 'Feature',
            # careful! r.geojson is of type str, we must convert it to a dictionary
            "geometry": json.loads(d['outline']),
            "properties": {
                'sn_l': d['sn_l'],
                'sn_r': d['sn_r'],
                'sn_k': d['sn_k'],
                'name': d['gen'],
                'cases': d['cases']
            }
        }

        features.append(feature)

    featurecollection = {
        "type": "FeatureCollection",
        "features": features
    }

    resp = Response(response=json.dumps(featurecollection, indent=4, sort_keys=True, default=str),
                    status=200,
                    mimetype="application/json")

    return resp


@routes.route('/landkreise/total', methods=['GET'])
@cache.cached()
def get_cases_by_landkreise_total():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(CasesPerLandkreisToday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/landkreise/yesterday', methods=['GET'])
@cache.cached()
def get_cases_by_landkreise_yesterday():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(CasesPerLandkreisYesterday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/landkreise/3daysbefore', methods=['GET'])
@cache.cached()
def get_cases_by_landkreise_3daysbefore():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(CasesPerLandkreis3DaysBefore).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/regierungsbezirke/total', methods=['GET'])
@cache.cached()
def get_cases_by_regierungsbezirke_total():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(CasesPerRegierungsbezirkToday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/regierungsbezirke/yesterday', methods=['GET'])
@cache.cached()
def get_cases_by_regierungsbezirke_yesterday():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(
        CasesPerRegierungsbezirkYesterday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/regierungsbezirke/3daysbefore', methods=['GET'])
@cache.cached()
def get_cases_by_regierungsbezirke_3daysbefore():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(
        CasesPerRegierungsbezirk3DaysBefore).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/bundeslaender/total', methods=['GET'])
@cache.cached()
def get_cases_by_bundeslaender_total():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(CasesPerBundeslandToday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/bundeslaender/yesterday', methods=['GET'])
@cache.cached()
def get_cases_by_rebundeslaender_yesterday():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(
        CasesPerBundeslandYesterday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/bundeslaender/3daysbefore', methods=['GET'])
@cache.cached()
def get_cases_by_bundeslaender_3daysbefore():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(
        CasesPerBundesland3DaysBefore).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


cd = CaseDevelopments('cases_per_county_and_day')


@routes.route('/development/landkreise', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_counties():
    return cd.get_by_counties(
        request.args.get('from'),
        request.args.get('to'),
        request.args.get('agegroups', type=bool))


@routes.route('/development/regierungsbezirke', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_districts():
    return cd.get_by_districts(
        request.args.get('from'),
        request.args.get('to'),
        request.args.get('agegroups', type=bool))


@routes.route('/development/bundeslaender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_states():
    return cd.get_by_states(
        request.args.get('from'),
        request.args.get('to'),
        request.args.get('agegroups', type=bool))


@routes.route('/development/laender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_countries():
    return cd.get_by_countries(
        request.args.get('from'),
        request.args.get('to'),
        request.args.get('agegroups', type=bool))


@routes.route('/development/landkreis/<idCounty>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_county(idCounty):
    return cd.get_county(
        request.args.get('from'),
        request.args.get('to'),
        idCounty,
        request.args.get('agegroups', type=bool))


@routes.route('/development/regierungsbezirk/<idDistrict>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_district(idDistrict):
    return cd.get_district(
        request.args.get('from'),
        request.args.get('to'),
        idDistrict,
        request.args.get('agegroups', type=bool))


@routes.route('/development/bundesland/<idState>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_state(idState):
    return cd.get_state(
        request.args.get('from'),
        request.args.get('to'),
        idState,
        request.args.get('agegroups', type=bool))


@routes.route('/development/land/<idCountry>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_country(idCountry):
    return cd.get_country(
        request.args.get('from'),
        request.args.get('to'),
        idCountry,
        request.args.get('agegroups', type=bool))


@routes.route('/development/aggregated', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_aggregated():
    return cd.get_aggregated({
        'landkreise': request.args.get('landkreise'),
        'regierungsbezirke': request.args.get('regierungsbezirke'),
        'bundeslaender': request.args.get('bundeslaender'),
        'laender': request.args.get('laender')
    },request.args.get('from'), request.args.get('to'), request.args.get('agegroups', type=bool))
