import logging
import json
from flask import Blueprint, Response, jsonify, request

from .model import *

backend_api = Blueprint('api', __name__)

logger = logging.getLogger(__name__)

@backend_api.route('/health')
def healthcheck():
    # FIXME: the database connection should be checked here!
    return "ok", 200

# Custom Rest API
@backend_api.route('/hospital', methods=['GET'])
def get_hospitals():
    """
        Return all Hospitals
    """
    hospitals = db.session.query(Hospital).all()
    results = []
    for elem in hospitals:
        results.append(elem.as_dict())
    return jsonify(results)
    


@backend_api.route('/hospital/<int:id>', methods=['GET'])
def get_hospital(id=None):
    """
        Return a specific hospital
        :param id: id of the specific hospital
    """
    if not id:
        return jsonify({})
    hospital = db.session.query(Hospital).filter_by(id=id)
    results = []
    for elem in hospital:
        results.append(elem.as_dict())
    return jsonify(results)


@backend_api.route('/person', methods=['GET'])
def get_persons():
    """
        Return all persons
    """
    persons = db.session.query(Person).all()
    results = []
    for elem in persons:
        results.append(elem.as_dict())
    return jsonify(results)


@backend_api.route('/person/<int:id>', methods=['GET'])
def get_person(id=None):
    """
        Return a specific person
        :param id: id of the specific person
    """
    if not id:
        return jsonify({})
    persons = db.session.query(Person).filter_by(id=id)
    results = []
    for elem in persons:
        results.append(elem.as_dict())
    return jsonify(results)


@backend_api.route('/bed', methods=['GET'])
def get_beds():
    """
        Return all beds
    """
    beds = db.session.query(Bed).all()
    results = []
    for elem in beds:
        results.append(elem.as_dict())
    return jsonify(results)


@backend_api.route('/bed/<int:id>', methods=['GET'])
def get_bed(id=None):
    """
        Return a specific bed
        :param id: id of the specific bed
    """
    if not id:
        return jsonify({})
    beds = db.session.query(Bed).filter_by(id=id)
    results = []
    for elem in beds:
        results.append(elem.as_dict())
    return jsonify(results)

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