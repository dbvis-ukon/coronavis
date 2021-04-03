import json

from flask import Blueprint, Response

from cache import cache
from db import db

routes = Blueprint('osm', __name__, url_prefix='/osm')


@routes.route('/hospitals', methods=['GET'])
@cache.cached()
def get_osm_hospitals():
    """
        Return all Hospitals
    """
    sql_stmt = '''
        SELECT
            objectid AS osm_id,
            name,
            st_asgeojson(wkb_geometry) AS geom
        FROM hospitals_max;
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


@routes.route('/nearby_helipads', methods=['GET'])
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
            SELECT
            objectid AS osm_id,
            name,
            wkb_geometry AS geom
        FROM hospitals_max
        )
        SELECT b.osm_id, b.name, st_asgeojson(b.geom), st_distance(krankenhaus.geom::geography, b.geom::geography) 
            as distance_to_hospital
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
