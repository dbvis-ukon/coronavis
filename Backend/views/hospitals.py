import json

from flask import Blueprint, jsonify

from cache import cache
from db import db
from models.hospital import Hospital, HospitalsPerLandkreis, HospitalsPerRegierungsbezirk, HospitalsPerBundesland
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
@cache.cached()
def get_categorical_hospital_development():
    """
        Return all Hospitals
    """
    sql_stmt = """
-- get all updates of all hospitals
WITH hospital_updates AS (
    SELECT
        DISTINCT ON (hospital.name, hospital.last_update) hospital.name,
        hospital.last_update,
        hospital.icu_low_state,
        hospital.icu_high_state,
        hospital.ecmo_state
    FROM
        hospital
    ORDER BY
        hospital.name,
        hospital.last_update
),
-- aggregate the hospital information per hospital and create a timeseries
hospital_updates_aggregated AS (
    SELECT
        h.name,
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
        h.name
),
-- get hospital metadata such as location and address
hospital_information AS (
    SELECT
        DISTINCT ON (hospital.name) hospital.id,
        hospital.name,
        hospital.address,
        hospital.state,
        hospital.contact,
        hospital.location,
        hospital.icu_low_state,
        hospital.icu_high_state,
        hospital.ecmo_state,
        hospital.last_update,
        hospital.insert_date
    FROM
        hospital
    ORDER BY
        hospital.name
) -- join hospital timeseries with hospital metadata
SELECT
    agg.name,
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
    JOIN hospital_information hi ON agg.name :: text = hi.name :: text
    JOIN LATERAL (
        SELECT
            helipads.osm_id,
            helipads.name,
            helipads.geom
        FROM
            helipads
        ORDER BY
            (hi.location <-> helipads.geom)
        LIMIT
            1
    ) b ON true;
"""
    sql_result = db.engine.execute(sql_stmt).fetchall()

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
@cache.cached()
def get_categorical_hospital_development_per_landkreise():
    """
        Return all Hospitals
    """
    sql_stmt = """
-- get the first update per hospital
WITH first_update_per_hospital AS (
    SELECT
        DISTINCT ON(h.name) h.name,
        h.last_update AS first_update
    FROM
        hospital h -- hardcoded to be larger than 16.03.2020 because somehow we have a few reports that have a date from 2013 and this ruins everything later
    WHERE
        h.last_update >= '2020-03-16'
    ORDER BY
        h."name",
        h.last_update :: date
) -- create a timeseries for each hospital from first_update of hospital to now()
,
hospital_time_series AS (
    SELECT
        first_update_per_hospital.name,
        b.timestamp
    FROM
        first_update_per_hospital
        JOIN LATERAL (
            SELECT
                generate_series(
                    first_update_per_hospital.first_update :: date,
                    now() :: date,
                    '1 day' :: interval
                ) AS timestamp
        ) b ON TRUE
) -- now get the latest update per hospital per day
,
latest_hospital_update_per_day AS (
    SELECT
        DISTINCT ON(h.name, h.last_update :: date) h.name,
        h.LOCATION AS geom,
        h.last_update,
        h.icu_low_state,
        h.icu_high_state,
        h.ecmo_state
    FROM
        hospital h
    ORDER BY
        h."name",
        h.last_update :: date,
        h.last_update desc
) -- now we can left join the hospital timeseries with the latest hospital update per day
-- additionally we fill empty values in the timeseries with the latest available value 
,
filled_hospital_timeseries AS (
    SELECT
        t.name,
        FIRST_VALUE(t.geom) over (partition by grp_close) as geom,
        t.timestamp,
        first_value(last_update) over (partition by grp_close) as last_update,
        first_value(icu_low_state) over (partition by grp_close) as icu_low_state,
        first_value(icu_high_state) over (partition by grp_close) as icu_high_state,
        first_value(ecmo_state) over (partition by grp_close) as ecmo_state
    FROM
        (
            SELECT
                hospital_time_series.name,
                hospital_time_series.timestamp,
                latest_hospital_update_per_day.geom,
                latest_hospital_update_per_day.last_update,
                latest_hospital_update_per_day.icu_low_state,
                latest_hospital_update_per_day.icu_high_state,
                latest_hospital_update_per_day.ecmo_state,
                -- this group allows us to partition the data later which we need to fill null values in the middle of the timeseries
                sum(
                    case
                        when latest_hospital_update_per_day.last_update is not null then 1
                    END
                ) over (
                    order by
                        hospital_time_series.name,
                        hospital_time_series.timestamp
                ) as grp_close
            FROM
                hospital_time_series
                LEFT JOIN latest_hospital_update_per_day ON hospital_time_series.name = latest_hospital_update_per_day.name
                AND hospital_time_series.timestamp = latest_hospital_update_per_day.last_update :: date
        ) t
) -- now we can group our data per landkreis, per day and sum up the number of available icu and ecmo beds
,
places_per_landkreis_per_timestamp AS (
    SELECT
        l.ids,
        l.name,
        l.geom,
        filled_hospital_timeseries.timestamp,
        max(filled_hospital_timeseries.last_update) AS last_update,
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
    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
    CASE
        WHEN min(places_per_landkreis_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_agg(
            json_build_object(
                'timestamp',
                places_per_landkreis_per_timestamp.timestamp,
                'last_update',
                places_per_landkreis_per_timestamp.last_update,
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
    END AS development
FROM
    places_per_landkreis_per_timestamp
GROUP BY
    places_per_landkreis_per_timestamp.ids,
    places_per_landkreis_per_timestamp.name,
    places_per_landkreis_per_timestamp.geom
"""
    sql_result = db.engine.execute(sql_stmt).fetchall()

    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            "geometry": r[2],
            "properties": {
                "id": r[0],
                "address": r[1],
                "developments": r[3]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    return jsonify(featurecollection), 200

@routes.route('/development/regierungsbezirke', methods=['GET'])
@cache.cached()
def get_categorical_hospital_development_per_regierungsbezirk():
    """
        Return all Hospitals
    """
    sql_stmt = """
-- get the first update per hospital
WITH first_update_per_hospital AS (
    SELECT
        DISTINCT ON(h.name) h.name,
        h.last_update AS first_update
    FROM
        hospital h -- hardcoded to be larger than 16.03.2020 because somehow we have a few reports that have a date from 2013 and this ruins everything later
    WHERE
        h.last_update >= '2020-03-16'
    ORDER BY
        h."name",
        h.last_update :: date
) -- create a timeseries for each hospital from first_update of hospital to now()
,
hospital_time_series AS (
    SELECT
        first_update_per_hospital.name,
        b.timestamp
    FROM
        first_update_per_hospital
        JOIN LATERAL (
            SELECT
                generate_series(
                    first_update_per_hospital.first_update :: date,
                    now() :: date,
                    '1 day' :: interval
                ) AS timestamp
        ) b ON TRUE
) -- now get the latest update per hospital per day
,
latest_hospital_update_per_day AS (
    SELECT
        DISTINCT ON(h.name, h.last_update :: date) h.name,
        h.LOCATION AS geom,
        h.last_update,
        h.icu_low_state,
        h.icu_high_state,
        h.ecmo_state
    FROM
        hospital h
    ORDER BY
        h."name",
        h.last_update :: date,
        h.last_update desc
) -- now we can left join the hospital timeseries with the latest hospital update per day
-- additionally we fill empty values in the timeseries with the latest available value 
,
filled_hospital_timeseries AS (
    SELECT
        t.name,
        FIRST_VALUE(t.geom) over (partition by grp_close) as geom,
        t.timestamp,
        first_value(last_update) over (partition by grp_close) as last_update,
        first_value(icu_low_state) over (partition by grp_close) as icu_low_state,
        first_value(icu_high_state) over (partition by grp_close) as icu_high_state,
        first_value(ecmo_state) over (partition by grp_close) as ecmo_state
    FROM
        (
            SELECT
                hospital_time_series.name,
                hospital_time_series.timestamp,
                latest_hospital_update_per_day.geom,
                latest_hospital_update_per_day.last_update,
                latest_hospital_update_per_day.icu_low_state,
                latest_hospital_update_per_day.icu_high_state,
                latest_hospital_update_per_day.ecmo_state,
                -- this group allows us to partition the data later which we need to fill null values in the middle of the timeseries
                sum(
                    case
                        when latest_hospital_update_per_day.last_update is not null then 1
                    END
                ) over (
                    order by
                        hospital_time_series.name,
                        hospital_time_series.timestamp
                ) as grp_close
            FROM
                hospital_time_series
                LEFT JOIN latest_hospital_update_per_day ON hospital_time_series.name = latest_hospital_update_per_day.name
                AND hospital_time_series.timestamp = latest_hospital_update_per_day.last_update :: date
        ) t
) -- now we can group our data per landkreis, per day and sum up the number of available icu and ecmo beds
,
places_per_regierungsbezirk_per_timestamp AS (
    SELECT
        r.ids,
        r.name,
        r.geom,
        filled_hospital_timeseries.timestamp,
        max(filled_hospital_timeseries.last_update) AS last_update,
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
    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
    CASE
        WHEN min(places_per_regierungsbezirk_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_agg(
            json_build_object(
                'timestamp',
                places_per_regierungsbezirk_per_timestamp.timestamp,
                'last_update',
                places_per_regierungsbezirk_per_timestamp.last_update,
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
    END AS development
FROM
    places_per_regierungsbezirk_per_timestamp
GROUP BY
    places_per_regierungsbezirk_per_timestamp.ids,
    places_per_regierungsbezirk_per_timestamp.name,
    places_per_regierungsbezirk_per_timestamp.geom
"""
    sql_result = db.engine.execute(sql_stmt).fetchall()

    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            "geometry": r[2],
            "properties": {
                "id": r[0],
                "address": r[1],
                "developments": r[3]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    return jsonify(featurecollection), 200

@routes.route('/development/bundeslaender', methods=['GET'])
@cache.cached()
def get_categorical_hospital_development_per_bundesland():
    """
        Return all Hospitals
    """
    sql_stmt = """
-- get the first update per hospital
WITH first_update_per_hospital AS (
    SELECT
        DISTINCT ON(h.name) h.name,
        h.last_update AS first_update
    FROM
        hospital h -- hardcoded to be larger than 16.03.2020 because somehow we have a few reports that have a date from 2013 and this ruins everything later
    WHERE
        h.last_update >= '2020-03-16'
    ORDER BY
        h."name",
        h.last_update :: date
) -- create a timeseries for each hospital from first_update of hospital to now()
,
hospital_time_series AS (
    SELECT
        first_update_per_hospital.name,
        b.timestamp
    FROM
        first_update_per_hospital
        JOIN LATERAL (
            SELECT
                generate_series(
                    first_update_per_hospital.first_update :: date,
                    now() :: date,
                    '1 day' :: interval
                ) AS timestamp
        ) b ON TRUE
) -- now get the latest update per hospital per day
,
latest_hospital_update_per_day AS (
    SELECT
        DISTINCT ON(h.name, h.last_update :: date) h.name,
        h.LOCATION AS geom,
        h.last_update,
        h.icu_low_state,
        h.icu_high_state,
        h.ecmo_state
    FROM
        hospital h
    ORDER BY
        h."name",
        h.last_update :: date,
        h.last_update desc
) -- now we can left join the hospital timeseries with the latest hospital update per day
-- additionally we fill empty values in the timeseries with the latest available value 
,
filled_hospital_timeseries AS (
    SELECT
        t.name,
        FIRST_VALUE(t.geom) over (partition by grp_close) as geom,
        t.timestamp,
        first_value(last_update) over (partition by grp_close) as last_update,
        first_value(icu_low_state) over (partition by grp_close) as icu_low_state,
        first_value(icu_high_state) over (partition by grp_close) as icu_high_state,
        first_value(ecmo_state) over (partition by grp_close) as ecmo_state
    FROM
        (
            SELECT
                hospital_time_series.name,
                hospital_time_series.timestamp,
                latest_hospital_update_per_day.geom,
                latest_hospital_update_per_day.last_update,
                latest_hospital_update_per_day.icu_low_state,
                latest_hospital_update_per_day.icu_high_state,
                latest_hospital_update_per_day.ecmo_state,
                -- this group allows us to partition the data later which we need to fill null values in the middle of the timeseries
                sum(
                    case
                        when latest_hospital_update_per_day.last_update is not null then 1
                    END
                ) over (
                    order by
                        hospital_time_series.name,
                        hospital_time_series.timestamp
                ) as grp_close
            FROM
                hospital_time_series
                LEFT JOIN latest_hospital_update_per_day ON hospital_time_series.name = latest_hospital_update_per_day.name
                AND hospital_time_series.timestamp = latest_hospital_update_per_day.last_update :: date
        ) t
) -- now we can group our data per landkreis, per day and sum up the number of available icu and ecmo beds
,
places_per_bundesland_per_timestamp AS (
    SELECT
        b.ids,
        b.name,
        b.geom,
        filled_hospital_timeseries.timestamp,
        max(filled_hospital_timeseries.last_update) AS last_update,
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
    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
    CASE
        WHEN min(places_per_bundesland_per_timestamp.timestamp) IS NULL THEN NULL
        ELSE json_agg(
            json_build_object(
                'timestamp',
                places_per_bundesland_per_timestamp.timestamp,
                'last_update',
                places_per_bundesland_per_timestamp.last_update,
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
    END AS development
FROM
    places_per_bundesland_per_timestamp
GROUP BY
    places_per_bundesland_per_timestamp.ids,
    places_per_bundesland_per_timestamp.name,
    places_per_bundesland_per_timestamp.geom
"""
    sql_result = db.engine.execute(sql_stmt).fetchall()

    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            "geometry": r[2],
            "properties": {
                "id": r[0],
                "address": r[1],
                "developments": r[3]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    return jsonify(featurecollection), 200