import datetime
import json

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from cache import cache
from db import db
from models.hospital import (Hospital, HospitalsPerBundesland,
                             HospitalsPerLandkreis,
                             HospitalsPerRegierungsbezirk)
from views.helpers import __as_feature_collection

routes = Blueprint('hospitals', __name__, url_prefix='/hospitals')


@routes.route('/', methods=['GET'])
@cache.cached()
def get_hospitals():
    """
        Return all Hospitals
    """
    hospitals = db.session.query(Hospital).all()
    return jsonify(__as_feature_collection(hospitals)), 200


@routes.route('/landkreise', methods=['GET'])
@cache.cached()
def get_hospitals_by_landkreise():
    """
        Return all Hospitals
    """
    hospitalsAggregated = db.session.query(HospitalsPerLandkreis).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/regierungsbezirke', methods=['GET'])
@cache.cached()
def get_hospitals_by_regierungsbezirke():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(HospitalsPerRegierungsbezirk).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/bundeslander', methods=['GET'])
@cache.cached()
def get_hospitals_by_bundeslander():
    """
        Return all Hospitals
    """

    hospitalsAggregated = db.session.query(HospitalsPerBundesland).all()
    return jsonify(__as_feature_collection(hospitalsAggregated)), 200


@routes.route('/development', methods=['GET'])
@cache.cached(query_string = True)
def get_categorical_hospital_development():
    """
        Return all Hospitals
    """
    sql_stmt = text(
    """-- get all updates of all hospitals
WITH hospital_updates AS (
    SELECT
        DISTINCT ON (h.hospital_id, h.last_update)
                                                     h.hospital_id,
                                                     h.name,
        h.last_update,
        h.icu_low_state,
        h.icu_high_state,
        h.ecmo_state
    FROM
        hospital_extended h
    -- hard limit due to data change of divi
    WHERE h.last_update::date <= :refDate ::date
    ORDER BY
        h.hospital_id,
        h.last_update,
        h.name,
        h.insert_date desc
),
-- aggregate the hospital information per hospital and create a timeseries
hospital_updates_aggregated AS (
    SELECT
        h.hospital_id,
        json_agg(
            json_build_object(
                'timestamp',
                h.last_update,
                'icu_low_care',
                json_build_object(h.icu_low_state, 1),
                'icu_high_care',
                json_build_object(h.icu_high_state, 1),
                'ecmo_state',
                json_build_object(h.ecmo_state, 1)
            )
            ORDER BY
                h.last_update
        ) AS json_agg
    FROM
        hospital_updates h
    GROUP BY
        h.hospital_id
),
-- get hospital metadata such as location and address
hospital_information AS (
    SELECT
        MAX(id) as id,
        hospital_id,
        (MAX(ARRAY[h.last_update::text, name]))[2] AS name,
        (MAX(ARRAY[h.last_update::text, address]))[2] AS address,
        (MAX(ARRAY[h.last_update::text, state]))[2] AS state,
        (MAX(ARRAY[h.last_update::text, contact]))[2] AS contact,
        (MAX(ARRAY[h.last_update::text, state]))[2] AS state,
        st_geomfromtext((MAX(ARRAY[h.last_update::text, st_astext(location)]))[2], 4326) AS location,
        (MAX(ARRAY[h.last_update::text, icu_low_state]))[2] AS icu_low_state,
        (MAX(ARRAY[h.last_update::text, icu_high_state]))[2] AS icu_high_state,
        (MAX(ARRAY[h.last_update::text, ecmo_state]))[2] AS ecmo_state,
        MAX(h.last_update) AS last_update,
        MAX(h.insert_date) AS insert_date
    FROM
        hospital_extended h
    WHERE st_x(location) > 0
        AND st_x(location) < 999
        AND st_y(location) > 0
        AND st_y(location) < 999
    GROUP BY
        h.hospital_id
    HAVING (:refDate ::date - MAX(last_update)::timestamp)::interval <= (:maxDaysOld || ' days')::interval
    ORDER BY
        h.hospital_id
) -- join hospital timeseries with hospital metadata
SELECT
    hi.name,
    hi.address,
    hi.contact,
    st_asgeojson(hi.location)::json AS geojson,
    CASE
        WHEN st_distance(hi.location :: geography, b.geom :: geography) < 500 :: double precision THEN true
        ELSE false
    END AS helipad_nearby,
    agg.json_agg AS development
FROM
    hospital_updates_aggregated agg
    JOIN hospital_information hi ON agg.hospital_id = hi.hospital_id
    JOIN LATERAL (
        SELECT
            helipads.osm_id,
            helipads.name,
            helipads.geom
        FROM
            helipads
        -- remove invalid geo locations
        WHERE st_x(location) > 0
        AND st_x(location) < 999
        AND st_y(location) > 0
        AND st_y(location) < 999
        ORDER BY
            (hi.location <-> helipads.geom)
        LIMIT
            1
    ) b ON true
""")

    maxDaysOld = request.args.get('maxDaysOld') or '1000'
    refDate = request.args.get('refDate') or datetime.datetime.today().strftime('%Y-%m-%d')
    sql_result = db.engine.execute(sql_stmt, maxDaysOld = maxDaysOld, refDate = refDate).fetchall()

    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            "geometry": r[3],
            "properties": {
                "name": r[0],
                "address": r[1],
                "contact": r[2],
                "helipad_nearby": r[4],
                "developments": r[5]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    return jsonify(featurecollection), 200

@routes.route('/development/landkreise', methods=['GET'])
@cache.cached(query_string = True)
def get_categorical_hospital_development_per_landkreise():
    """
        Return all Hospitals
    """
    sql_stmt = text("""
-- get the first update per hospital
WITH filled_hospital_timeseries AS (
    SELECT * FROM filled_hospital_timeseries_with_fix f
    WHERE f.timestamp::date <= :refDate ::date
    AND f.timestamp - f.last_update <= (:maxDaysOld || ' days') ::interval
) -- now we can group our data per landkreis, per day and sum up the number of available icu and ecmo beds
,
places_per_landkreis_per_timestamp AS (
    SELECT
        l.ids,
        l.name,
        l.geom,
        filled_hospital_timeseries.timestamp,
        max(filled_hospital_timeseries.last_update) AS last_update,
        count(filled_hospital_timeseries.name) AS numHospitals,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_low_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS icu_low_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS icu_low_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_low_nv,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_high_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS icu_high_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS icu_high_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_high_nv,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_nv
    FROM
        landkreise l
        LEFT JOIN filled_hospital_timeseries ON ST_Contains(l.geom, filled_hospital_timeseries.geom)
    WHERE timestamp IS NOT NULL
    GROUP BY
        l.ids,
        l.name,
        l.geom,
        filled_hospital_timeseries.timestamp
) -- now for the final aggregation by landkreis
SELECT
    places_per_landkreis_per_timestamp.ids AS id,
    places_per_landkreis_per_timestamp.name,
    st_asgeojson(places_per_landkreis_per_timestamp.geom) :: json AS geom,
    st_asgeojson(st_centroid(places_per_landkreis_per_timestamp.geom)):: json AS centroid,
    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
    CASE
        WHEN min(places_per_landkreis_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_agg(
            json_build_object(
                'timestamp',
                places_per_landkreis_per_timestamp.timestamp,
                'last_update',
                places_per_landkreis_per_timestamp.last_update,
                'numHospitals',
                places_per_landkreis_per_timestamp.numHospitals,
                'icu_low_care',
                json_build_object(
                    'Verfügbar',
                    places_per_landkreis_per_timestamp.icu_low_v,
                    'Begrenzt',
                    places_per_landkreis_per_timestamp.icu_low_b,
                    'Ausgelastet',
                    places_per_landkreis_per_timestamp.icu_low_a,
                    'Nicht verfügbar',
                    places_per_landkreis_per_timestamp.icu_low_nv
                ),
                'icu_high_care',
                json_build_object(
                    'Verfügbar',
                    places_per_landkreis_per_timestamp.icu_high_v,
                    'Begrenzt',
                    places_per_landkreis_per_timestamp.icu_high_b,
                    'Ausgelastet',
                    places_per_landkreis_per_timestamp.icu_high_a,
                    'Nicht verfügbar',
                    places_per_landkreis_per_timestamp.icu_high_nv
                ),
                'ecmo_state',
                json_build_object(
                    'Verfügbar',
                    places_per_landkreis_per_timestamp.ecmo_low_v,
                    'Begrenzt',
                    places_per_landkreis_per_timestamp.ecmo_low_b,
                    'Ausgelastet',
                    places_per_landkreis_per_timestamp.ecmo_low_a,
                    'Nicht verfügbar',
                    places_per_landkreis_per_timestamp.ecmo_low_nv
                )
            )
            ORDER BY
                places_per_landkreis_per_timestamp.timestamp
        )
    END AS development,
    CASE
        WHEN min(places_per_landkreis_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_object_agg(
            places_per_landkreis_per_timestamp.timestamp::date,
            json_build_object(
                'timestamp',
                places_per_landkreis_per_timestamp.timestamp,
                'last_update',
                places_per_landkreis_per_timestamp.last_update,
                'numHospitals',
                places_per_landkreis_per_timestamp.numHospitals,
                'icu_low_care',
                json_build_object(
                    'Verfügbar',
                    places_per_landkreis_per_timestamp.icu_low_v,
                    'Begrenzt',
                    places_per_landkreis_per_timestamp.icu_low_b,
                    'Ausgelastet',
                    places_per_landkreis_per_timestamp.icu_low_a,
                    'Nicht verfügbar',
                    places_per_landkreis_per_timestamp.icu_low_nv
                ),
                'icu_high_care',
                json_build_object(
                    'Verfügbar',
                    places_per_landkreis_per_timestamp.icu_high_v,
                    'Begrenzt',
                    places_per_landkreis_per_timestamp.icu_high_b,
                    'Ausgelastet',
                    places_per_landkreis_per_timestamp.icu_high_a,
                    'Nicht verfügbar',
                    places_per_landkreis_per_timestamp.icu_high_nv
                ),
                'ecmo_state',
                json_build_object(
                    'Verfügbar',
                    places_per_landkreis_per_timestamp.ecmo_low_v,
                    'Begrenzt',
                    places_per_landkreis_per_timestamp.ecmo_low_b,
                    'Ausgelastet',
                    places_per_landkreis_per_timestamp.ecmo_low_a,
                    'Nicht verfügbar',
                    places_per_landkreis_per_timestamp.ecmo_low_nv
                )
            )
            ORDER BY
                places_per_landkreis_per_timestamp.timestamp
        )
    END AS developmentDays
FROM
    places_per_landkreis_per_timestamp
GROUP BY
    places_per_landkreis_per_timestamp.ids,
    places_per_landkreis_per_timestamp.name,
    places_per_landkreis_per_timestamp.geom
""")

    maxDaysOld = request.args.get('maxDaysOld') or '1000'
    refDate = request.args.get('refDate') or datetime.datetime.today().strftime('%Y-%m-%d')
    sql_result = db.engine.execute(sql_stmt, maxDaysOld = maxDaysOld, refDate = refDate).fetchall()

    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            "geometry": r[2],
            "properties": {
                "id": r[0],
                "name": r[1],
                "centroid": r[3],
                "developments": r[4],
                "developmentDays": r[5]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    return jsonify(featurecollection), 200

@routes.route('/development/regierungsbezirke', methods=['GET'])
@cache.cached(query_string = True)
def get_categorical_hospital_development_per_regierungsbezirk():
    """
        Return all Hospitals
    """
    sql_stmt = text("""
-- get the first update per hospital
WITH filled_hospital_timeseries AS (
    SELECT * FROM filled_hospital_timeseries_with_fix f
    WHERE f.timestamp::date <= :refDate ::date
    AND f.timestamp - f.last_update <= (:maxDaysOld || ' days') ::interval
) -- now we can group our data per landkreis, per day and sum up the number of available icu and ecmo beds
,
places_per_regierungsbezirk_per_timestamp AS (
    SELECT
        r.ids,
        r.name,
        r.geom,
        filled_hospital_timeseries.timestamp,
        max(filled_hospital_timeseries.last_update) AS last_update,
        count(filled_hospital_timeseries.name) AS numHospitals,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_low_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS icu_low_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS icu_low_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_low_nv,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_high_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS icu_high_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS icu_high_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_high_nv,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_nv
    FROM
        regierungsbezirke r
        LEFT JOIN filled_hospital_timeseries ON ST_Contains(r.geom, filled_hospital_timeseries.geom)
    WHERE timestamp IS NOT NULL
    GROUP BY
        r.ids,
        r.name,
        r.geom,
        filled_hospital_timeseries.timestamp
) -- now for the final aggregation by landkreis
SELECT
    places_per_regierungsbezirk_per_timestamp.ids AS id,
    places_per_regierungsbezirk_per_timestamp.name,
    st_asgeojson(places_per_regierungsbezirk_per_timestamp.geom) :: json AS geom,
    st_asgeojson(st_centroid(places_per_regierungsbezirk_per_timestamp.geom)):: json AS centroid,
    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
    CASE
        WHEN min(places_per_regierungsbezirk_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_agg(
            json_build_object(
                'timestamp',
                places_per_regierungsbezirk_per_timestamp.timestamp,
                'last_update',
                places_per_regierungsbezirk_per_timestamp.last_update,
                'numHospitals',
                places_per_regierungsbezirk_per_timestamp.numHospitals,
                'icu_low_care',
                json_build_object(
                    'Verfügbar',
                    places_per_regierungsbezirk_per_timestamp.icu_low_v,
                    'Begrenzt',
                    places_per_regierungsbezirk_per_timestamp.icu_low_b,
                    'Ausgelastet',
                    places_per_regierungsbezirk_per_timestamp.icu_low_a,
                    'Nicht verfügbar',
                    places_per_regierungsbezirk_per_timestamp.icu_low_nv
                ),
                'icu_high_care',
                json_build_object(
                    'Verfügbar',
                    places_per_regierungsbezirk_per_timestamp.icu_high_v,
                    'Begrenzt',
                    places_per_regierungsbezirk_per_timestamp.icu_high_b,
                    'Ausgelastet',
                    places_per_regierungsbezirk_per_timestamp.icu_high_a,
                    'Nicht verfügbar',
                    places_per_regierungsbezirk_per_timestamp.icu_high_nv
                ),
                'ecmo_state',
                json_build_object(
                    'Verfügbar',
                    places_per_regierungsbezirk_per_timestamp.ecmo_low_v,
                    'Begrenzt',
                    places_per_regierungsbezirk_per_timestamp.ecmo_low_b,
                    'Ausgelastet',
                    places_per_regierungsbezirk_per_timestamp.ecmo_low_a,
                    'Nicht verfügbar',
                    places_per_regierungsbezirk_per_timestamp.ecmo_low_nv
                )
            )
            ORDER BY
                places_per_regierungsbezirk_per_timestamp.timestamp
        )
    END AS development,
    CASE
        WHEN min(places_per_regierungsbezirk_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_object_agg(
            places_per_regierungsbezirk_per_timestamp.timestamp::date,
            json_build_object(
                'timestamp',
                places_per_regierungsbezirk_per_timestamp.timestamp,
                'last_update',
                places_per_regierungsbezirk_per_timestamp.last_update,
                'numHospitals',
                places_per_regierungsbezirk_per_timestamp.numHospitals,
                'icu_low_care',
                json_build_object(
                    'Verfügbar',
                    places_per_regierungsbezirk_per_timestamp.icu_low_v,
                    'Begrenzt',
                    places_per_regierungsbezirk_per_timestamp.icu_low_b,
                    'Ausgelastet',
                    places_per_regierungsbezirk_per_timestamp.icu_low_a,
                    'Nicht verfügbar',
                    places_per_regierungsbezirk_per_timestamp.icu_low_nv
                ),
                'icu_high_care',
                json_build_object(
                    'Verfügbar',
                    places_per_regierungsbezirk_per_timestamp.icu_high_v,
                    'Begrenzt',
                    places_per_regierungsbezirk_per_timestamp.icu_high_b,
                    'Ausgelastet',
                    places_per_regierungsbezirk_per_timestamp.icu_high_a,
                    'Nicht verfügbar',
                    places_per_regierungsbezirk_per_timestamp.icu_high_nv
                ),
                'ecmo_state',
                json_build_object(
                    'Verfügbar',
                    places_per_regierungsbezirk_per_timestamp.ecmo_low_v,
                    'Begrenzt',
                    places_per_regierungsbezirk_per_timestamp.ecmo_low_b,
                    'Ausgelastet',
                    places_per_regierungsbezirk_per_timestamp.ecmo_low_a,
                    'Nicht verfügbar',
                    places_per_regierungsbezirk_per_timestamp.ecmo_low_nv
                )
            )
            ORDER BY
                places_per_regierungsbezirk_per_timestamp.timestamp
        )
    END AS developmentDays
FROM
    places_per_regierungsbezirk_per_timestamp
GROUP BY
    places_per_regierungsbezirk_per_timestamp.ids,
    places_per_regierungsbezirk_per_timestamp.name,
    places_per_regierungsbezirk_per_timestamp.geom
""")

    maxDaysOld = request.args.get('maxDaysOld') or '1000'
    refDate = request.args.get('refDate') or datetime.datetime.today().strftime('%Y-%m-%d')
    sql_result = db.engine.execute(sql_stmt, maxDaysOld = maxDaysOld, refDate = refDate).fetchall()

    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            "geometry": r[2],
            "properties": {
                "id": r[0],
                "name": r[1],
                "centroid": r[3],
                "developments": r[4],
                "developmentDays": r[5]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    return jsonify(featurecollection), 200

@routes.route('/development/bundeslaender', methods=['GET'])
@cache.cached(query_string = True)
def get_categorical_hospital_development_per_bundesland():
    """
        Return all Hospitals
    """
    sql_stmt = text("""
-- get the first update per hospital
WITH filled_hospital_timeseries AS (
    SELECT * FROM filled_hospital_timeseries_with_fix f
    WHERE f.timestamp::date <= :refDate ::date
    AND f.timestamp - f.last_update <= (:maxDaysOld || ' days') ::interval

) -- now we can group our data per landkreis, per day and sum up the number of available icu and ecmo beds
,
places_per_bundesland_per_timestamp AS (
    SELECT
        b.ids,
        b.name,
        b.geom,
        filled_hospital_timeseries.timestamp,
        max(filled_hospital_timeseries.last_update) AS last_update,
        count(filled_hospital_timeseries.name) AS numHospitals,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_low_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS icu_low_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS icu_low_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_low_nv,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_high_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS icu_high_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS icu_high_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_high_nv,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_nv
    FROM
        bundeslaender b
        LEFT JOIN filled_hospital_timeseries ON ST_Contains(b.geom, filled_hospital_timeseries.geom)
    WHERE timestamp IS NOT NULL
    GROUP BY
        b.ids,
        b.name,
        b.geom,
        filled_hospital_timeseries.timestamp
) -- now for the final aggregation by landkreis
SELECT
    places_per_bundesland_per_timestamp.ids AS id,
    places_per_bundesland_per_timestamp.name,
    st_asgeojson(places_per_bundesland_per_timestamp.geom) :: json AS geom,
    st_asgeojson(st_centroid(places_per_bundesland_per_timestamp.geom)):: json AS centroid,
    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
    CASE
        WHEN min(places_per_bundesland_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_agg(
            json_build_object(
                'timestamp',
                places_per_bundesland_per_timestamp.timestamp,
                'last_update',
                places_per_bundesland_per_timestamp.last_update,
                'numHospitals',
                places_per_bundesland_per_timestamp.numHospitals,
                'icu_low_care',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.icu_low_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.icu_low_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.icu_low_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.icu_low_nv
                ),
                'icu_high_care',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.icu_high_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.icu_high_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.icu_high_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.icu_high_nv
                ),
                'ecmo_state',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.ecmo_low_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.ecmo_low_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.ecmo_low_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.ecmo_low_nv
                )
            )
            ORDER BY
                places_per_bundesland_per_timestamp.timestamp
        )
    END AS development,
    CASE
        WHEN min(places_per_bundesland_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_object_agg(
            places_per_bundesland_per_timestamp.timestamp::date,
            json_build_object(
                'timestamp',
                places_per_bundesland_per_timestamp.timestamp,
                'last_update',
                places_per_bundesland_per_timestamp.last_update,
                'numHospitals',
                places_per_bundesland_per_timestamp.numHospitals,
                'icu_low_care',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.icu_low_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.icu_low_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.icu_low_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.icu_low_nv
                ),
                'icu_high_care',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.icu_high_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.icu_high_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.icu_high_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.icu_high_nv
                ),
                'ecmo_state',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.ecmo_low_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.ecmo_low_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.ecmo_low_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.ecmo_low_nv
                )
            )
            ORDER BY
                places_per_bundesland_per_timestamp.timestamp
        )
    END AS developmentDays
FROM
    places_per_bundesland_per_timestamp
GROUP BY
    places_per_bundesland_per_timestamp.ids,
    places_per_bundesland_per_timestamp.name,
    places_per_bundesland_per_timestamp.geom
""")

    maxDaysOld = request.args.get('maxDaysOld') or '1000'
    refDate = request.args.get('refDate') or datetime.datetime.today().strftime('%Y-%m-%d')
    sql_result = db.engine.execute(sql_stmt, maxDaysOld = maxDaysOld, refDate = refDate).fetchall()

    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            "geometry": r[2],
            "properties": {
                "id": r[0],
                "name": r[1],
                "centroid": r[3],
                "developments": r[4],
                "developmentDays": r[5]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    return jsonify(featurecollection), 200



@routes.route('/development/laender', methods=['GET'])
@cache.cached(query_string = True)
def get_categorical_hospital_development_per_land():
    """
        Return all Hospitals
    """
    sql_stmt = text("""
    -- get the first update per hospital
WITH filled_hospital_timeseries AS (
    SELECT * FROM filled_hospital_timeseries_with_fix f
    WHERE f.timestamp::date <= :refDate ::date
    AND f.timestamp - f.last_update <= (:maxDaysOld || ' days') ::interval
),
places_per_bundesland_per_timestamp AS (
    SELECT
        ger.ids,
        ger.name,
        ger.geom,
        filled_hospital_timeseries.timestamp,
        max(filled_hospital_timeseries.last_update) AS last_update,
        count(filled_hospital_timeseries.name) AS numHospitals,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_low_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS icu_low_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS icu_low_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_low_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_low_nv,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_high_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS icu_high_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS icu_high_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.icu_high_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS icu_high_nv,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Verfügbar' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_v,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Begrenzt' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_b,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Ausgelastet' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_a,
        sum(
            CASE
                WHEN filled_hospital_timeseries.ecmo_state = 'Nicht verfügbar' THEN 1
                ELSE 0
            END
        ) AS ecmo_low_nv
    FROM
        germany ger
        LEFT JOIN filled_hospital_timeseries ON ST_Contains(ger.geom, filled_hospital_timeseries.geom)
    WHERE timestamp IS NOT NULL
    GROUP BY
        ger.ids,
        ger.name,
        ger.geom,
        filled_hospital_timeseries.timestamp
) -- now for the final aggregation by landkreis
SELECT
    places_per_bundesland_per_timestamp.ids AS id,
    places_per_bundesland_per_timestamp.name,
    st_asgeojson(places_per_bundesland_per_timestamp.geom) :: json AS geom,
    st_asgeojson(st_centroid(places_per_bundesland_per_timestamp.geom)):: json AS centroid,
    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
    CASE
        WHEN min(places_per_bundesland_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_agg(
            json_build_object(
                'timestamp',
                places_per_bundesland_per_timestamp.timestamp,
                'last_update',
                places_per_bundesland_per_timestamp.last_update,
                'numHospitals',
                places_per_bundesland_per_timestamp.numHospitals,
                'icu_low_care',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.icu_low_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.icu_low_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.icu_low_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.icu_low_nv
                ),
                'icu_high_care',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.icu_high_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.icu_high_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.icu_high_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.icu_high_nv
                ),
                'ecmo_state',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.ecmo_low_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.ecmo_low_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.ecmo_low_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.ecmo_low_nv
                )
            )
            ORDER BY
                places_per_bundesland_per_timestamp.timestamp
        )
    END AS development,
    CASE
        WHEN min(places_per_bundesland_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_object_agg(
            places_per_bundesland_per_timestamp.timestamp::date,
            json_build_object(
                'timestamp',
                places_per_bundesland_per_timestamp.timestamp,
                'last_update',
                places_per_bundesland_per_timestamp.last_update,
                'numHospitals',
                places_per_bundesland_per_timestamp.numHospitals,
                'icu_low_care',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.icu_low_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.icu_low_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.icu_low_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.icu_low_nv
                ),
                'icu_high_care',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.icu_high_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.icu_high_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.icu_high_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.icu_high_nv
                ),
                'ecmo_state',
                json_build_object(
                    'Verfügbar',
                    places_per_bundesland_per_timestamp.ecmo_low_v,
                    'Begrenzt',
                    places_per_bundesland_per_timestamp.ecmo_low_b,
                    'Ausgelastet',
                    places_per_bundesland_per_timestamp.ecmo_low_a,
                    'Nicht verfügbar',
                    places_per_bundesland_per_timestamp.ecmo_low_nv
                )
            )
            ORDER BY
                places_per_bundesland_per_timestamp.timestamp
        )
    END AS developmentDays
FROM
    places_per_bundesland_per_timestamp
GROUP BY
    places_per_bundesland_per_timestamp.ids,
    places_per_bundesland_per_timestamp.name,
    places_per_bundesland_per_timestamp.geom
""")

    maxDaysOld = request.args.get('maxDaysOld') or '1000'
    refDate = request.args.get('refDate') or datetime.datetime.today().strftime('%Y-%m-%d')
    sql_result = db.engine.execute(sql_stmt, maxDaysOld = maxDaysOld, refDate = refDate).fetchall()

    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            "geometry": r[2],
            "properties": {
                "id": r[0],
                "name": r[1],
                "centroid": r[3],
                "developments": r[4],
                "developmentDays": r[5]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    return jsonify(featurecollection), 200
