import time
import logging
import json
from collections import Counter
from flask import Blueprint, Response, jsonify, request

from .model import *

backend_api = Blueprint('api', __name__)

logger = logging.getLogger(__name__)

@backend_api.route('/health')
def healthcheck():
    # FIXME: the database connection should be checked here!
    return "ok", 200

# Custom Rest API
@backend_api.route('/hospitals', methods=['GET', 'POST'])
def get_hospitals():
    """
        Return all Hospitals
    """
    start = time.time()
    sql_stmt = '''
select index, name, address, contact, icu_low_state, icu_high_state, ecmo_state, last_update, st_asgeojson(geom) as geojson
from hospitals_crawled hc
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
            "geometry": json.loads(d['geojson']),
            "properties": {
                'index': d['index'],
                'name': d['name'],
                'address': d['address'],
                'contact': d['contact'],
                'icu_low_state': d['icu_low_state'],
                'icu_high_state': d['icu_high_state'],
                'ecmo_state': d['ecmo_state'],
                'last_update': d['last_update']
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
    end = time.time()
    print('Time: ', end - start)
    return resp

# Custom Rest API
@backend_api.route('/hospitals_2', methods=['GET'])
def get_hospitals_2():
    """
        Return all Hospitals
    """
    start = time.time()
    hospitals = db.session.query(Hospital).all() #.options(FromCache(cache)).all()
    results = {'features':[]}
    for elem in hospitals:
        results['features'].append(elem.as_dict())
    end = time.time()
    print('Time: ', end - start)
    return jsonify(results)


# Custom Rest API
@backend_api.route('/hospitals/landkreise', methods=['GET', 'POST'])
def get_hospitals_by_landkreise():
    """
        Return all Hospitals
    """

    sql_stmt = '''
select vkv.sn_l, vkv.sn_r, vkv.sn_k, JSON_AGG(coalesce(hc.icu_low_state, '')) as icu_low_state, JSON_AGG(coalesce(hc.icu_high_state, '')) as icu_high_state, JSON_AGG(coalesce(hc.ecmo_state, '')) as ecmo_state, ST_AsGeoJSON(ST_union(vkv.geom)) as outline, ST_AsGeoJSON(ST_Centroid(ST_Union(vkv.geom))) as centroid
from vg250_krs vkv left join hospitals_crawled hc on ST_Contains(vkv.geom, hc.geom) 
group by vkv.sn_l, vkv.sn_r, vkv.sn_k
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
                'centroid': json.loads(d['centroid']),
                'icu_low_state': dict(Counter(d['icu_low_state'])),
                'icu_high_state': dict(Counter(d['icu_high_state'])),
                'ecmo_state': dict(Counter(d['ecmo_state']))
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

# Custom Rest API
@backend_api.route('/hospitals/regierungsbezirke', methods=['GET', 'POST'])
def get_hospitals_by_regierungsbezirke():
    """
        Return all Hospitals
    """

    sql_stmt = '''
select vkv.sn_l, vkv.sn_r, JSON_AGG(coalesce(hc.icu_low_state, '')) as icu_low_state, JSON_AGG(coalesce(hc.icu_high_state, '')) as icu_high_state, JSON_AGG(coalesce(hc.ecmo_state, '')) as ecmo_state, ST_AsGeoJSON(ST_union(vkv.geom)) as outline, ST_AsGeoJSON(ST_Centroid(ST_Union(vkv.geom))) as centroid
from vg250_krs vkv left join hospitals_crawled hc on ST_Contains(vkv.geom, hc.geom) 
group by vkv.sn_l, vkv.sn_r
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
                'centroid': json.loads(d['centroid']),
                'icu_low_state': dict(Counter(d['icu_low_state'])),
                'icu_high_state': dict(Counter(d['icu_high_state'])),
                'ecmo_state': dict(Counter(d['ecmo_state']))
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

# Custom Rest API
@backend_api.route('/hospitals/bundeslander', methods=['GET', 'POST'])
def get_hospitals_by_bundeslander():
    """
        Return all Hospitals
    """

    sql_stmt = '''
select vkv.sn_l, JSON_AGG(coalesce(hc.icu_low_state, '')) as icu_low_state, JSON_AGG(coalesce(hc.icu_high_state, '')) as icu_high_state, JSON_AGG(coalesce(hc.ecmo_state, '')) as ecmo_state, ST_AsGeoJSON(ST_union(vkv.geom)) as outline, ST_AsGeoJSON(ST_Centroid(ST_Union(vkv.geom))) as centroid
from vg250_krs vkv left join hospitals_crawled hc on ST_Contains(vkv.geom, hc.geom) 
group by vkv.sn_l
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
                'centroid': json.loads(d['centroid']),
                'icu_low_state': dict(Counter(d['icu_low_state'])),
                'icu_high_state': dict(Counter(d['icu_high_state'])),
                'ecmo_state': dict(Counter(d['ecmo_state']))
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

@backend_api.route('/osm/hospitals', methods=['GET', 'POST'])
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

    featurecollection = {
        "type": "FeatureCollection",
        "features": features
    }

    resp = Response(response=json.dumps(featurecollection),
            status=200,
            mimetype="application/json")

    return resp

@backend_api.route('/osm/nearby_helipads', methods=['GET', 'POST'])
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

    featurecollection = {
        "type": "FeatureCollection",
        "features": features
    }

    resp = Response(response=json.dumps(featurecollection),
            status=200,
            mimetype="application/json")

    return resp
