# flask imports, CORS will be important next week (install using: pip install -U flask-cors)
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# general python imports
import json

# psycopg2 imports
import psycopg2
import psycopg2.extras

# constants, check whether to use localhost or gis-database as the URL depending if its running in Docker 
IN_DOCKER = True
DB_HOST = "gis-database" if IN_DOCKER else "localhost"
DB_PORT = "5432" if IN_DOCKER else "15432"
DB_USER = "gis_user"
DB_PASS = "gis_pass"
DB_NAME = "gis"

# we've imported flask, we still need to create an instance. __name__ is a built-in variable which evaluates 
# to the name of the current module. Thus it can be used to check whether the current script is being run on 
# its own or being imported somewhere else by combining it with if statement, as shown below.
app = Flask(__name__)
# extend flask with CORS, will be necessary next week
CORS(app)

@app.route('/health')
def healthcheck():
    # FIXME: the database connection should be checked here!
    return "ok", 200


# specify the endpoint and which request methods are allowed. In this case we allow GET and POST requests, 
# all other requests are not allowed and will results in HTTP Error: 405: Method not allowed"
@app.route('/api/data/regierungsbezirke', methods=["GET", "POST"])
def regierungsbezirke():

    # The SQL Query, triple quotes allow us to write multi-line strings
    query = """
        SELECT osm_id as osm_id, name as name, st_asgeojson(way) as geojson, st_area(way::geography) / (1000 * 1000) as area
        FROM planet_osm_polygon
        where admin_level = '5'
        ORDER BY way_area DESC
        LIMIT 4
    """

    # Create a psycopg2 connection in a with-block. This is similar to the try-with-resources Statement in Java
    # According to psycopg2 documentation, this wraps this block effectively into one transaction
    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:

        # Create a cursor object, which allos us to create the connection
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:

            # execute the query
            cur.execute(query)

            # fetch ALL results, we could also use fetchone() or fetchmany()
            records = cur.fetchall()

    # close the connection, after we're finished
    conn.close()

    # parse records into an result array and return it jsonified with the HTTP status code 200: OK 
    # careful! r.geojson is of type str, we must convert it to a dictionary first
    return jsonify([{"osm_id": r.osm_id, "name": r.name, "geojson": json.loads(r.geojson), "area": r.area} for r in records]), 200


@app.route('/api/data/landkreise', methods=["POST"])
def landkreise():
    query = """
        SELECT osm_id as osm_id, name as name, st_asgeojson(way) as geojson, st_area(way::geography) / (1000 * 1000) as area
        FROM planet_osm_polygon
        where admin_level = '6' and boundary = 'administrative'
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    return jsonify([{"osm_id": r.osm_id, "name": r.name, "geojson": json.loads(r.geojson), "area": r.area} for r in records]), 200


@app.route('/api/data/bardichte', methods=["POST"])
def bardichte():
    query = """
        select polygons.osm_id, polygons.name as name, st_asgeojson(polygons.way) as geojson, st_area(polygons.way::geography) / (1000 * 1000) as area, COUNT(points.*) as num_bars
        from planet_osm_polygon polygons JOIN planet_osm_point points ON ST_Contains(polygons.way, points.way)
        where polygons.admin_level = '6' and polygons.boundary = 'administrative' AND (points.amenity='bar' OR points.amenity='pub')
        group by polygons.osm_id, polygons.name, polygons.way
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()

    features = []
    for r in records:
        feature = {
            "type": 'Feature',
            # careful! r.geojson is of type str, we must convert it to a dictionary
            "geometry": json.loads(r.geojson),
            "properties": {
                "osm_id": r.osm_id,
                "name": r.name,
                "area": r.area,
                "num_bars": r.num_bars
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

@app.route('/api/data/averagebardichte', methods=["POST"])
def averagebardichte():
    query = """
        WITH bars as (
                select polygons.osm_id, polygons.name as name, ST_AsGeoJSON(polygons.way) as geojson, 
                    st_area(polygons.way::geography) / (1000 * 1000) as area, COUNT(points.*) as num_bars
                from planet_osm_polygon polygons JOIN planet_osm_point points ON ST_Contains(polygons.way, points.way)
                where polygons.admin_level = '6' and polygons.boundary = 'administrative' AND (points.amenity='bar' OR points.amenity='pub')
                group by polygons.osm_id, polygons.name, polygons.way
        )
        SELECT b.*, l.population
        from bars b JOIN landkreise l ON b.name LIKE '%'||l.name||'%'
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()


    features = []
    for r in records:
        feature = {
            "type": 'Feature',
            # careful! r.geojson is of type str, we must convert it to a dictionary
            "geometry": json.loads(r.geojson),
            "properties": {
                "osm_id": r.osm_id,
                "name": r.name,
                "area": r.area,
                "num_bars": r.num_bars,
                # cast Decimal to float
                "population": float(r.population)
            }
        }

        #print(feature)

        features.append(feature)

    featurecollection = {
        "type": "FeatureCollection",
        "features": features
    }

    resp = Response(response=json.dumps(featurecollection),
                    status=200,
                    mimetype="application/json")
    return(resp)

