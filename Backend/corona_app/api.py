import logging
import json
from flask import Blueprint, Response, jsonify, request

from db import engine

backend_api = Blueprint('api', __name__)

logger = logging.getLogger(__name__)

@backend_api.route("/")
def test():
    return 'Hello World'


@backend_api.route("/hospitals", methods=['GET', 'POST'])
def hospitals():

    with engine.connect() as con:
        rs = con.execute("SELECT name, ST_AsGeoJSON(ST_Transform(way, 4326)) FROM planet_osm_point WHERE amenity='hospital'")
        
        features = []

        for r in rs:
            feature = {
                "type": 'Feature',
                # careful! r.geojson is of type str, we must convert it to a dictionary
                "geometry": json.loads(r[1]),
                "properties": {
                    "name": r[0]
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

        return(resp)

