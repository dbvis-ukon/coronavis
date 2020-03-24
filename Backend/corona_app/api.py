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


# # Custom Rest API
# @backend_api.route('/hospitals', methods=['GET', 'POST'])
# def get_hospitals():
#     """
#         Return all Hospitals
#     """
#     sql_stmt = '''
# select index, name, address, contact, icu_low_state, icu_high_state, ecmo_state, last_update, st_asgeojson(geom) as geojson
# from hospitals_crawled hc
#     '''
#     sql_result = db.engine.execute(sql_stmt)

#     d, features = {}, []
#     for row in sql_result:
#         for column, value in row.items():
#             # build up the dictionary
#             d = {**d, **{column: value}}

#         feature = {
#             "type": 'Feature',
#             # careful! r.geojson is of type str, we must convert it to a dictionary
#             "geometry": json.loads(d['geojson']),
#             "properties": {
#                 'index': d['index'],
#                 'name': d['name'],
#                 'address': d['address'],
#                 'contact': d['contact'],
#                 'icu_low_state': d['icu_low_state'],
#                 'icu_high_state': d['icu_high_state'],
#                 'ecmo_state': d['ecmo_state'],
#                 'last_update': d['last_update']
#             }
#         }

#         features.append(feature)

#     featurecollection = {
#         "type": "FeatureCollection",
#         "features": features
#     }

#     resp = Response(response=json.dumps(featurecollection, indent=4, sort_keys=True, default=str),
#             status=200,
#             mimetype="application/json")
#     return resp


# Custom Rest API
@backend_api.route('/hospitals', methods=['GET'])
@cache.cached()
def get_hospitals():
    """
        Return all Hospitals
    """
    hospitals = db.session.query(Hospital).distinct(
                 Hospital.name).order_by(Hospital.name, Hospital.last_update.desc()).all()

    features = []
    for elem in hospitals:
        features.append(elem.as_dict())
    featurecollection = {"type": "FeatureCollection", "features": features}
    return jsonify(featurecollection)


# Custom Rest API
@backend_api.route('/hospitals/landkreise', methods=['GET'])
@cache.cached()
def get_hospitals_by_landkreise():
    """
        Return all Hospitals
    """

    sql_stmt = '''
with last_hospital_data as (
	select distinct on (name) *
	from hospital
	order by name, last_update DESC
)
select vkv.sn_l, vkv.sn_r, vkv.sn_k, vkv.gen, 
	JSON_AGG(coalesce(hc.icu_low_state, '')) as icu_low_state, JSON_AGG(coalesce(hc.icu_high_state, '')) as icu_high_state, JSON_AGG(coalesce(hc.ecmo_state, '')) as ecmo_state, 
	ST_AsGeoJSON(ST_MakeValid(st_simplifyPreserveTopology(ST_union(vkv.geom), 0.005))) as outline, ST_AsGeoJSON(ST_Centroid(ST_Union(vkv.geom))) as centroid
from vg250_krs vkv left join last_hospital_data hc on ST_Contains(vkv.geom, hc.location) 
group by vkv.sn_l, vkv.sn_r, vkv.sn_k, vkv.gen
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
            "geometry": json.loads(str(d['outline'])),
            "properties": {
                'sn_l': d['sn_l'],
                'sn_r': d['sn_r'],
                'sn_k': d['sn_k'],
                'name': d['gen'],
                'centroid': json.loads(d['centroid']),
                'icu_low_state': dict(Counter(d['icu_low_state'])),
                'icu_high_state': dict(Counter(d['icu_high_state'])),
                'ecmo_state': dict(Counter(d['ecmo_state']))
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    resp = Response(response=json.dumps(featurecollection,
                                        indent=4,
                                        sort_keys=True,
                                        default=str),
                    status=200,
                    mimetype="application/json")

    return resp


# Custom Rest API
@backend_api.route('/hospitals/regierungsbezirke', methods=['GET'])
@cache.cached()
def get_hospitals_by_regierungsbezirke():
    """
        Return all Hospitals
    """

    # use regierungsbezirke if they are available, for the others use bundeslaender
    sql_stmt = '''
with last_hospital_data as (
	select distinct on (name) *
	from hospital
	order by name, last_update DESC
)
select vkv.sn_l, vkv.sn_r, vkv.gen, JSON_AGG(coalesce(hc.icu_low_state, '')) as icu_low_state, JSON_AGG(coalesce(hc.icu_high_state, '')) as icu_high_state, JSON_AGG(coalesce(hc.ecmo_state, '')) as ecmo_state, ST_AsGeoJSON(ST_MakeValid(st_simplifyPreserveTopology(ST_union(vkv.geom), 0.005))) as outline, ST_AsGeoJSON(ST_Centroid(ST_Union(vkv.geom))) as centroid
from vg250_rbz vkv left join last_hospital_data hc on ST_Contains(vkv.geom, hc.location)
group by vkv.sn_l, vkv.sn_r, vkv.gen
union all
select vkv.sn_l, vkv.sn_r, vkv.gen, JSON_AGG(coalesce(hc.icu_low_state, '')) as icu_low_state, JSON_AGG(coalesce(hc.icu_high_state, '')) as icu_high_state, JSON_AGG(coalesce(hc.ecmo_state, '')) as ecmo_state, ST_AsGeoJSON(ST_MakeValid(st_simplifyPreserveTopology(ST_union(vkv.geom), 0.005))) as outline, ST_AsGeoJSON(ST_Centroid(ST_Union(vkv.geom))) as centroid
from vg250_lan vkv left join last_hospital_data hc on ST_Contains(vkv.geom, hc.location)
where NOT (vkv.gen = ANY(array['Baden-Württemberg', 'Baden-Württemberg (Bodensee)', 'Bayern', 'Bayern (Bodensee)', 'Hessen', 'Nordrhein-Westfalen']))
group by vkv.sn_l, vkv.sn_r, vkv.gen
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
                'name': d['gen'],
                'centroid': json.loads(d['centroid']),
                'icu_low_state': dict(Counter(d['icu_low_state'])),
                'icu_high_state': dict(Counter(d['icu_high_state'])),
                'ecmo_state': dict(Counter(d['ecmo_state']))
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    resp = Response(response=json.dumps(featurecollection,
                                        indent=4,
                                        sort_keys=True,
                                        default=str),
                    status=200,
                    mimetype="application/json")

    return resp


# Custom Rest API
@backend_api.route('/hospitals/bundeslander', methods=['GET'])
@cache.cached()
def get_hospitals_by_bundeslander():
    """
        Return all Hospitals
    """

    sql_stmt = '''
with last_hospital_data as (
	select distinct on (name) *
	from hospital
	order by name, last_update DESC
)
select vkv.sn_l, vkv.gen, 
	JSON_AGG(coalesce(hc.icu_low_state, '')) as icu_low_state, JSON_AGG(coalesce(hc.icu_high_state, '')) as icu_high_state, JSON_AGG(coalesce(hc.ecmo_state, '')) as ecmo_state, 
	ST_AsGeoJSON(ST_MakeValid(st_simplifyPreserveTopology(ST_union(vkv.geom), 0.005))) as outline, ST_AsGeoJSON(ST_Centroid(ST_Union(vkv.geom))) as centroid
from vg250_lan vkv left join last_hospital_data hc on ST_Contains(vkv.geom, hc.location)
where vkv.gen not like '%%Bodensee%%'
group by vkv.sn_l, vkv.gen
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
                'name': d['gen'],
                'centroid': json.loads(d['centroid']),
                'icu_low_state': dict(Counter(d['icu_low_state'])),
                'icu_high_state': dict(Counter(d['icu_high_state'])),
                'ecmo_state': dict(Counter(d['ecmo_state']))
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    resp = Response(response=json.dumps(featurecollection,
                                        indent=4,
                                        sort_keys=True,
                                        default=str),
                    status=200,
                    mimetype="application/json")

    return resp


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

    sql_stmt = '''
with cases_per_landkreis as(
	select case when t.idlandkreis like '11___' then '11000' else t.idlandkreis end, min(c.landkreis) as landkreis, max(t.meldedatum) as until, SUM(case when c.casetype = 'case' then 1 else 0 end) as cases, SUM(case when c.casetype = 'death' then 1 else 0 end) as deaths
	from (
		(select distinct(idlandkreis) from cases_current) landkreise
		cross join
		(select generate_series(min(meldedatum), max(meldedatum), '1 day'::interval) as meldedatum from cases_current) dates
	) t
	left join cases_current c on t.idlandkreis = c.idlandkreis and t.meldedatum = date(c.meldedatum)
	group by t.idlandkreis
	order by idlandkreis, until
), b as (
	select case when char_length(kreisschluessel::text) = 4 then '0' || kreisschluessel::text else kreisschluessel::text end, sum(anzahl) as bevoelkerung
	from bevoelkerung
	group by kreisschluessel
)
select distinct on (vk.sn_l, vk.sn_r, vk.sn_k) vk.sn_l, vk.sn_r, vk.sn_k, vk.gen, until, c.cases, c.deaths, b.bevoelkerung, ST_AsGeoJSON(ST_MakeValid(st_simplifyPreserveTopology(vk.geom, 0.005))) as outline
from vg250_krs vk join cases_per_landkreis c on vk.ags = c.idlandkreis join b on vk.ags = b.kreisschluessel
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
                'bevoelkerung': d['bevoelkerung'],
                'until': d['until'],
                'cases': d['cases'],
                'deaths': d['deaths']
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

@backend_api.route('/cases/landkreise/yesterday', methods=['GET'])
@cache.cached()
def get_cases_by_landkreise_yesterday():
    """
        Return all Hospitals
    """

    sql_stmt = '''
with cases_per_landkreis as(
	select case when t.idlandkreis like '11___' then '11000' else t.idlandkreis end, min(c.landkreis) as landkreis, max(t.meldedatum) as until, SUM(case when c.casetype = 'case' then 1 else 0 end) as cases, SUM(case when c.casetype = 'death' then 1 else 0 end) as deaths
	from (
		(select distinct(idlandkreis) from cases_current) landkreise
		cross join
		(select generate_series(min(meldedatum), max(meldedatum)  - '1 day'::interval, '1 day'::interval) as meldedatum from cases_current) dates
	) t
	left join cases_current c on t.idlandkreis = c.idlandkreis and t.meldedatum = date(c.meldedatum)
	group by t.idlandkreis
	order by idlandkreis, until
), b as (
	select case when char_length(kreisschluessel::text) = 4 then '0' || kreisschluessel::text else kreisschluessel::text end, sum(anzahl) as bevoelkerung
	from bevoelkerung
	group by kreisschluessel
)
select distinct on (vk.sn_l, vk.sn_r, vk.sn_k) vk.sn_l, vk.sn_r, vk.sn_k, vk.gen, until, c.cases, c.deaths, b.bevoelkerung, ST_AsGeoJSON(ST_MakeValid(st_simplifyPreserveTopology(vk.geom, 0.005))) as outline
from vg250_krs vk join cases_per_landkreis c on vk.ags = c.idlandkreis join b on vk.ags = b.kreisschluessel
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
                'bevoelkerung': d['bevoelkerung'],
                'until': d['until'],
                'cases': d['cases'],
                'deaths': d['deaths']
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

@backend_api.route('/cases/landkreise/3daysbefore', methods=['GET'])
@cache.cached()
def get_cases_by_landkreise_3daysbefore():
    """
        Return all Hospitals
    """

    sql_stmt = '''
with cases_per_landkreis as(
	select case when t.idlandkreis like '11___' then '11000' else t.idlandkreis end, min(c.landkreis) as landkreis, max(t.meldedatum) as until, SUM(case when c.casetype = 'case' then 1 else 0 end) as cases, SUM(case when c.casetype = 'death' then 1 else 0 end) as deaths
	from (
		(select distinct(idlandkreis) from cases_current) landkreise
		cross join
		(select generate_series(min(meldedatum), max(meldedatum)  - '3 day'::interval, '1 day'::interval) as meldedatum from cases_current) dates
	) t
	left join cases_current c on t.idlandkreis = c.idlandkreis and t.meldedatum = date(c.meldedatum)
	group by t.idlandkreis
	order by idlandkreis, until
), b as (
	select case when char_length(kreisschluessel::text) = 4 then '0' || kreisschluessel::text else kreisschluessel::text end, sum(anzahl) as bevoelkerung
	from bevoelkerung
	group by kreisschluessel
)
select distinct on (vk.sn_l, vk.sn_r, vk.sn_k) vk.sn_l, vk.sn_r, vk.sn_k, vk.gen, until, c.cases, c.deaths, b.bevoelkerung, ST_AsGeoJSON(ST_MakeValid(st_simplifyPreserveTopology(vk.geom, 0.005))) as outline
from vg250_krs vk join cases_per_landkreis c on vk.ags = c.idlandkreis join b on vk.ags = b.kreisschluessel
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
                'bevoelkerung': d['bevoelkerung'],
                'until': d['until'],
                'cases': d['cases'],
                'deaths': d['deaths']
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
