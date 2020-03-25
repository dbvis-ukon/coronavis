import time
import logging
import json
from collections import Counter
from flask import Blueprint, Response, jsonify, request
from flask_caching import Cache
from sqlalchemy import func, and_

from .model import *

cache = Cache(config={'CACHE_TYPE': 'simple', 'CACHE_DEFAULT_TIMEOUT': 5*60})

backend_api = Blueprint('api', __name__)

logger = logging.getLogger(__name__)


@backend_api.route('/health')
def healthcheck():
    # FIXME: the database connection should be checked here!
    return "ok", 200


@backend_api.route('/hospitals', methods=['GET'])
@cache.cached()
def get_hospitals():
    """
        Return all Hospitals
    """
    hospitals = db.session.query(Hospital).distinct(Hospital.name).order_by(
        Hospital.name, Hospital.last_update.desc()).all()
    return jsonify(__as_feature_collection(hospitals)), 200


@backend_api.route('/hospitals/landkreise', methods=['GET'])
@cache.cached()
def get_hospitals_by_landkreise():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(HospitalsPerLandkreis).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/hospitals/regierungsbezirke', methods=['GET'])
@cache.cached()
def get_hospitals_by_regierungsbezirke():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(HospitalsPerRegierungsbezirk).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/hospitals/bundeslander', methods=['GET'])
@cache.cached()
def get_hospitals_by_bundeslander():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(HospitalsPerBundesland).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/cases/landkreise', methods=['GET'])
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


@backend_api.route('/cases/landkreise/total', methods=['GET'])
@cache.cached()
def get_cases_by_landkreise_total():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(CasesPerLandkreisToday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/cases/landkreise/yesterday', methods=['GET'])
@cache.cached()
def get_cases_by_landkreise_yesterday():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(CasesPerLandkreisYesterday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/cases/landkreise/3daysbefore', methods=['GET'])
@cache.cached()
def get_cases_by_landkreise_3daysbefore():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(CasesPerLandkreis3DaysBefore).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/cases/regierungsbezirke/total', methods=['GET'])
@cache.cached()
def get_cases_by_regierungsbezirke_total():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(CasesPerRegierungsbezirkToday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/cases/regierungsbezirke/yesterday', methods=['GET'])
@cache.cached()
def get_cases_by_regierungsbezirke_yesterday():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(
        CasesPerRegierungsbezirkYesterday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/cases/regierungsbezirke/3daysbefore', methods=['GET'])
@cache.cached()
def get_cases_by_regierungsbezirke_3daysbefore():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(
        CasesPerRegierungsbezirk3DaysBefore).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/cases/bundeslaender/total', methods=['GET'])
@cache.cached()
def get_cases_by_bundeslaender_total():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(CasesPerBundeslandToday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/cases/bundeslaender/yesterday', methods=['GET'])
@cache.cached()
def get_cases_by_rebundeslaender_yesterday():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(
        CasesPerBundeslandYesterday).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@backend_api.route('/cases/bundeslaender/3daysbefore', methods=['GET'])
@cache.cached()
def get_cases_by_bundeslaender_3daysbefore():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(
        CasesPerBundesland3DaysBefore).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200

@backend_api.route('/osm/hospitals', methods=['GET'])
@cache.cached()
def get_osm_hospitals():
    """
        Return all Hospitals
    """
    sql_stmt = '''
select osm_id, name, st_asgeojson(way) as geom 
from planet_osm_point 
where amenity = 'hospital' and tags -> 'emergency' = 'yes' 

union 

select osm_id, name, st_asgeojson(st_centroid(way)) as geom 
from planet_osm_polygon 
where amenity = 'hospital' and tags -> 'emergency' = 'yes' 
    
    '''
    sql_result = db.engine.execute(sql_stmt).fetchall()

    # do stuff here
    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            # careful! r.geojson is of type str, we must convert it to a dictionary
            "geometry": json.loads(r[2]),
            "properties": {
                "osm_id": r[0],
                "name": r[1]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    resp = Response(response=json.dumps(featurecollection),
                    status=200,
                    mimetype="application/json")

    return resp


@backend_api.route('/osm/nearby_helipads', methods=['GET'])
@cache.cached()
def get_osm_nearby_helipads():
    """
        Return all Hospitals
    """
    sql_stmt = '''
with helipads as ( 	
	SELECT osm_id, name, way as geom
	FROM planet_osm_point
	WHERE aeroway = 'helipad' 	
	UNION
	SELECT osm_id, name, st_centroid(way) as geom
	FROM planet_osm_polygon 
	WHERE aeroway = 'helipad' 
), krankenhaus as ( 
	SELECT osm_id, name, way as geom  	
	FROM planet_osm_point   	
	WHERE amenity = 'hospital' and tags -> 'emergency' = 'yes'  
	UNION
	SELECT osm_id, name, st_centroid(way) as geom  
	FROM planet_osm_polygon   	
	WHERE amenity = 'hospital' and tags -> 'emergency' = 'yes'  
)
SELECT b.osm_id, b.name, st_asgeojson(b.geom), st_distance(krankenhaus.geom::geography, b.geom::geography) as distance_to_hospital 
FROM krankenhaus JOIN LATERAL (   
    SELECT *
    FROM helipads
    ORDER BY krankenhaus.geom <-> helipads.geom LIMIT 1 
) AS b ON true 
WHERE st_distance(krankenhaus.geom::geography, b.geom::geography) < 1000
    '''
    sql_result = db.engine.execute(sql_stmt).fetchall()

    # do stuff here
    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            # careful! r.geojson is of type str, we must convert it to a dictionary
            "geometry": json.loads(r[2]),
            "properties": {
                "osm_id": r[0],
                "name": r[1],
                "distance_to_hospital": r[3]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    resp = Response(response=json.dumps(featurecollection),
                    status=200,
                    mimetype="application/json")

    return resp


def __as_feature_collection(resultset):
    features = []
    for elem in resultset:
        features.append(elem.as_dict())
    featurecollection = {"type": "FeatureCollection", "features": features}
    return featurecollection
