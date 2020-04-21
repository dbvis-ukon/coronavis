import json

from flask import Blueprint, Response, jsonify
from sqlalchemy import text

from cache import cache
from db import db
from models.cases import (
    CasesPerBundesland3DaysBefore, CasesPerBundeslandToday,
    CasesPerBundeslandYesterday, CasesPerLandkreis3DaysBefore,
    CasesPerLandkreisToday, CasesPerLandkreisYesterday,
    CasesPerRegierungsbezirk3DaysBefore, CasesPerRegierungsbezirkToday,
    CasesPerRegierungsbezirkYesterday)
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


@routes.route('/development/landkreise', methods=['GET'])
@cache.cached()
def get_cases_development_by_counties():
    """
        Return the development of covid cases and deaths
        by counties
    """
    sql_stmt = text("""
WITH first_update_per_lk AS (
    SELECT DISTINCT ON (le.ids)
                                le.ids,
                                 le.name,
                                 le.bez,
                                 clk.date AS first_update
FROM caseslk clk
    -- special join here because RKI reports e.g. Berlin Marzahn whereas landkreise only contain 'Berlin'
    -- everything else can be matched by name and bez (bezeichnung)
JOIN landkreise_extended le on clk."desc" = le.bez AND (clk.name = le.name OR (le.name = 'Berlin' AND clk.name LIKE 'Berlin%'))
ORDER BY le.ids, clk.date::date
),
lk_time_series AS (
    SELECT
           first_update_per_lk.ids,
           first_update_per_lk.name,
           first_update_per_lk.bez,
           b.timestamp
    FROM first_update_per_lk
    JOIN LATERAL ( SELECT generate_series(
        first_update_per_lk.first_update::date::timestamp with time zone,
        now()::date::timestamp with time zone,
        '1 day'::interval) AS "timestamp") b ON true
),
latest_lk_update_per_day AS (
    SELECT DISTINCT ON (le.ids, clk.date::date)
                                        le.ids,
                                        le.name,
                                        le.bez,
                                        clk.date::date as day,
                                        le.geom AS geom,
                                        clk.date AS insert_date,
                                        clk.date AS last_update,
                                        clk.cases,
                                         clk.deaths,
                                         clk.death_rate,
                                         clk.cases_per_100k,
                                         clk.cases_per_population,
                                         clk.population
    FROM caseslk clk
    JOIN landkreise_extended le on clk."desc" = le.bez AND (clk.name = le.name OR (le.name = 'Berlin' AND clk.name LIKE 'Berlin%'))
    ORDER BY le.ids, clk.date::date, clk.date DESC
),
 filled_lk_timeseries AS (
         SELECT
                t.ids,
                t.name,
                t.bez,
                first_value(t.geom) OVER (PARTITION BY t.grp_close)           AS geom,
                t."timestamp",
                first_value(t.last_update) OVER (PARTITION BY t.grp_close)    AS last_update,
                first_value(t.insert_date) OVER (PARTITION BY t.grp_close)    AS last_insert_date,
                first_value(t.cases) OVER (PARTITION BY t.grp_close)  AS cases,
                first_value(t.cases_per_population) OVER (PARTITION BY t.grp_close) AS cases_per_population,
                first_value(t.cases_per_100k) OVER (PARTITION BY t.grp_close)     AS cases_per_100k,
                first_value(t.population) OVER (PARTITION BY t.grp_close)     AS population,
                first_value(t.deaths) OVER (PARTITION BY t.grp_close)     AS deaths,
                first_value(t.death_rate) OVER (PARTITION BY t.grp_close)     AS death_rate
         FROM (SELECT
                      lk_time_series.ids,
                      lk_time_series.name,
                      lk_time_series.bez,
                      lk_time_series.timestamp,
                      latest_lk_update_per_day.geom,
                      latest_lk_update_per_day.insert_date,
                      latest_lk_update_per_day.last_update,
                      latest_lk_update_per_day.cases,
                      latest_lk_update_per_day.cases_per_population,
                      latest_lk_update_per_day.cases_per_100k,
                      latest_lk_update_per_day.population,
                      latest_lk_update_per_day.deaths,
                      latest_lk_update_per_day.death_rate,
                      sum(
                      CASE
                          WHEN latest_lk_update_per_day.last_update IS NOT NULL THEN 1
                          ELSE NULL::integer
                          END) OVER (ORDER BY lk_time_series.name, lk_time_series.bez, lk_time_series."timestamp") AS grp_close
               FROM lk_time_series
                        LEFT JOIN latest_lk_update_per_day
                                  ON lk_time_series.ids = latest_lk_update_per_day.ids
                                     AND lk_time_series."timestamp" = latest_lk_update_per_day.last_update::date) t
)
SELECT
    filled_lk_timeseries.ids,
    filled_lk_timeseries.name,
    filled_lk_timeseries.bez,
    st_asgeojson(filled_lk_timeseries.geom) :: json AS geom,
    st_asgeojson(st_centroid(filled_lk_timeseries.geom)):: json AS centroid,
    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
    CASE
        WHEN min(filled_lk_timeseries.timestamp) IS NULL THEN NULL
        ELSE json_agg(
            json_build_object(
                'timestamp',
                filled_lk_timeseries.timestamp,
                'last_update',
                filled_lk_timeseries.last_update,
                'insert_date',
                filled_lk_timeseries.last_insert_date,
                'cases',
                filled_lk_timeseries.cases,
                'cases_per_population',
                filled_lk_timeseries.cases_per_population,
                'cases_per_100k',
                filled_lk_timeseries.cases_per_100k,
                'population',
                filled_lk_timeseries.population,
                'deaths',
                filled_lk_timeseries.deaths,
                'death_rate',
                filled_lk_timeseries.death_rate
            )
            ORDER BY
                filled_lk_timeseries.timestamp
        )
    END AS development,
    CASE
    WHEN min(filled_lk_timeseries.timestamp) IS NULL THEN NULL
    ELSE json_object_agg(
        filled_lk_timeseries.timestamp::date,
        json_build_object(
            'timestamp',
            filled_lk_timeseries.timestamp,
            'last_update',
            filled_lk_timeseries.last_update,
            'insert_date',
            filled_lk_timeseries.last_insert_date,
            'cases',
            filled_lk_timeseries.cases,
            'cases_per_population',
            filled_lk_timeseries.cases_per_population,
            'cases_per_100k',
            filled_lk_timeseries.cases_per_100k,
            'population',
            filled_lk_timeseries.population,
            'deaths',
            filled_lk_timeseries.deaths,
            'death_rate',
            filled_lk_timeseries.death_rate
        )
        ORDER BY
            filled_lk_timeseries.timestamp
    )
END AS developmentDays
FROM
    filled_lk_timeseries
GROUP BY
    filled_lk_timeseries.ids,
    filled_lk_timeseries.name,
    filled_lk_timeseries.bez,
    filled_lk_timeseries.geom
    """)

    sql_result = db.engine.execute(sql_stmt).fetchall()

    features = []
    for r in sql_result:
        feature = {
            "type": 'Feature',
            "geometry": r[3],
            "properties": {
                "id": r[0],
                "name": r[1],
                "description": r[2],
                "centroid": r[4],
                "developments": r[5],
                "developmentDays": r[6]
            }
        }

        features.append(feature)

    featurecollection = {"type": "FeatureCollection", "features": features}

    return jsonify(featurecollection), 200



@routes.route('/development/regierungsbezirke', methods=['GET'])
@cache.cached()
def get_cases_development_by_districts():
    """
        Return the development of covid cases and deaths
        by districts
    """
    sql_stmt = text("""
WITH first_update_per_lk AS (
    SELECT DISTINCT ON (le.ids) le.ids,
                                le.name,
                                le.bez,
                                clk.date AS first_update
    FROM caseslk clk
             -- special join here because RKI reports e.g. Berlin Marzahn whereas landkreise only contain 'Berlin'
             -- everything else can be matched by name and bez (bezeichnung)
             JOIN landkreise_extended le
                  on clk."desc" = le.bez AND (clk.name = le.name OR (le.name = 'Berlin' AND clk.name LIKE 'Berlin%'))
    ORDER BY le.ids, clk.date::date
),
     lk_time_series AS (
         SELECT first_update_per_lk.ids,
                first_update_per_lk.name,
                first_update_per_lk.bez,
                b.timestamp
         FROM first_update_per_lk
                  JOIN LATERAL ( SELECT generate_series(
                                                first_update_per_lk.first_update::date::timestamp with time zone,
                                                now()::date::timestamp with time zone,
                                                '1 day'::interval) AS "timestamp") b ON true
     ),
     latest_lk_update_per_day AS (
         SELECT DISTINCT ON (le.ids, clk.date::date) le.ids,
                                                     le.name,
                                                     le.bez,
                                                     clk.date::date as day,
                                                     le.geom        AS geom,
                                                     clk.date       AS insert_date,
                                                     clk.date       AS last_update,
                                                     clk.cases,
                                                     clk.deaths,
                                                     clk.death_rate,
                                                     clk.cases_per_100k,
                                                     clk.cases_per_population,
                                                     clk.population
         FROM caseslk clk
                  JOIN landkreise_extended le on clk."desc" = le.bez AND
                                                 (clk.name = le.name OR (le.name = 'Berlin' AND clk.name LIKE 'Berlin%'))
         ORDER BY le.ids, clk.date::date, clk.date DESC
     ),
     filled_lk_timeseries AS (
         SELECT t.ids,
                t.name,
                t.bez,
                first_value(t.geom) OVER (PARTITION BY t.grp_close)                 AS geom,
                t."timestamp",
                first_value(t.last_update) OVER (PARTITION BY t.grp_close)          AS last_update,
                first_value(t.insert_date) OVER (PARTITION BY t.grp_close)          AS last_insert_date,
                first_value(t.cases) OVER (PARTITION BY t.grp_close)                AS cases,
                first_value(t.cases_per_population) OVER (PARTITION BY t.grp_close) AS cases_per_population,
                first_value(t.cases_per_100k) OVER (PARTITION BY t.grp_close)       AS cases_per_100k,
                first_value(t.population) OVER (PARTITION BY t.grp_close)           AS population,
                first_value(t.deaths) OVER (PARTITION BY t.grp_close)               AS deaths,
                first_value(t.death_rate) OVER (PARTITION BY t.grp_close)           AS death_rate
         FROM (SELECT lk_time_series.ids,
                      lk_time_series.name,
                      lk_time_series.bez,
                      lk_time_series.timestamp,
                      latest_lk_update_per_day.geom,
                      latest_lk_update_per_day.insert_date,
                      latest_lk_update_per_day.last_update,
                      latest_lk_update_per_day.cases,
                      latest_lk_update_per_day.cases_per_population,
                      latest_lk_update_per_day.cases_per_100k,
                      latest_lk_update_per_day.population,
                      latest_lk_update_per_day.deaths,
                      latest_lk_update_per_day.death_rate,
                      sum(
                      CASE
                          WHEN latest_lk_update_per_day.last_update IS NOT NULL THEN 1
                          ELSE NULL::integer
                          END)
                      OVER (ORDER BY lk_time_series.name, lk_time_series.bez, lk_time_series."timestamp") AS grp_close
               FROM lk_time_series
                        LEFT JOIN latest_lk_update_per_day
                                  ON lk_time_series.ids = latest_lk_update_per_day.ids
                                      AND lk_time_series."timestamp" = latest_lk_update_per_day.last_update::date) t
     ),
     rb_agg AS (
         SELECT r.ids,
                r.name,
                filled_lk_timeseries.timestamp,
                MAX(filled_lk_timeseries.last_update)               AS last_update,
                MAX(filled_lk_timeseries.last_insert_date)          AS last_insert_date,
                string_agg(DISTINCT filled_lk_timeseries.name, ',') AS landkreise,
                r.geom,
                SUM(cases)                                          as cases,
                SUM(cases_per_100k)                                 as cases_per_100k,
                AVG(cases_per_population)                           as cases_per_population,
                SUM(population)                                     as population,
                SUM(deaths)                                         as deaths,
                AVG(death_rate)                                     as death_rate

         FROM filled_lk_timeseries
                  LEFT OUTER JOIN regierungsbezirke r ON filled_lk_timeseries.ids LIKE (r.ids || '%')
         GROUP BY r.ids,
                  r.name,
                  r.geom,
                  filled_lk_timeseries.timestamp
     )
SELECT rb_agg.ids,
       rb_agg.name,
       st_asgeojson(rb_agg.geom) :: json             AS geom,
       st_asgeojson(st_centroid(rb_agg.geom)):: json AS centroid,
       -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
       CASE
           WHEN min(rb_agg.timestamp) IS NULL THEN NULL
           ELSE json_agg(
                   json_build_object(
                           'timestamp',
                           rb_agg.timestamp,
                           'last_update',
                           rb_agg.last_update,
                           'insert_date',
                           rb_agg.last_insert_date,
                           'cases',
                           rb_agg.cases,
                           'cases_per_population',
                           rb_agg.cases_per_population,
                           'cases_per_100k',
                           rb_agg.cases_per_100k,
                           'population',
                           rb_agg.population,
                           'deaths',
                           rb_agg.deaths,
                           'death_rate',
                           rb_agg.death_rate
                       )
                   ORDER BY
                       rb_agg.timestamp
               )
           END                                       AS development,
       CASE
           WHEN min(rb_agg.timestamp) IS NULL THEN NULL
           ELSE json_object_agg(
                   rb_agg.timestamp::date,
                   json_build_object(
                           'timestamp',
                           rb_agg.timestamp,
                           'last_update',
                           rb_agg.last_update,
                           'insert_date',
                           rb_agg.last_insert_date,
                           'cases',
                           rb_agg.cases,
                           'cases_per_population',
                           rb_agg.cases_per_population,
                           'cases_per_100k',
                           rb_agg.cases_per_100k,
                           'population',
                           rb_agg.population,
                           'deaths',
                           rb_agg.deaths,
                           'death_rate',
                           rb_agg.death_rate
                       )
                   ORDER BY
                       rb_agg.timestamp
               )
           END                                       AS developmentDays
FROM rb_agg
GROUP BY rb_agg.ids,
         rb_agg.name,
         rb_agg.geom
    """)

    sql_result = db.engine.execute(sql_stmt).fetchall()

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
@cache.cached()
def get_cases_development_by_states():
    """
        Return the development of covid cases and deaths
        by states
    """
    sql_stmt = text("""
WITH first_update_per_lk AS (
    SELECT DISTINCT ON (le.ids) le.ids,
                                le.name,
                                le.bez,
                                clk.date AS first_update
    FROM caseslk clk
             -- special join here because RKI reports e.g. Berlin Marzahn whereas landkreise only contain 'Berlin'
             -- everything else can be matched by name and bez (bezeichnung)
             JOIN landkreise_extended le
                  on clk."desc" = le.bez AND (clk.name = le.name OR (le.name = 'Berlin' AND clk.name LIKE 'Berlin%'))
    ORDER BY le.ids, clk.date::date
),
     lk_time_series AS (
         SELECT first_update_per_lk.ids,
                first_update_per_lk.name,
                first_update_per_lk.bez,
                b.timestamp
         FROM first_update_per_lk
                  JOIN LATERAL ( SELECT generate_series(
                                                first_update_per_lk.first_update::date::timestamp with time zone,
                                                now()::date::timestamp with time zone,
                                                '1 day'::interval) AS "timestamp") b ON true
     ),
     latest_lk_update_per_day AS (
         SELECT DISTINCT ON (le.ids, clk.date::date) le.ids,
                                                     le.name,
                                                     le.bez,
                                                     clk.date::date as day,
                                                     le.geom        AS geom,
                                                     clk.date       AS insert_date,
                                                     clk.date       AS last_update,
                                                     clk.cases,
                                                     clk.deaths,
                                                     clk.death_rate,
                                                     clk.cases_per_100k,
                                                     clk.cases_per_population,
                                                     clk.population
         FROM caseslk clk
                  JOIN landkreise_extended le on clk."desc" = le.bez AND
                                                 (clk.name = le.name OR (le.name = 'Berlin' AND clk.name LIKE 'Berlin%'))
         ORDER BY le.ids, clk.date::date, clk.date DESC
     ),
     filled_lk_timeseries AS (
         SELECT t.ids,
                t.name,
                t.bez,
                first_value(t.geom) OVER (PARTITION BY t.grp_close)                 AS geom,
                t."timestamp",
                first_value(t.last_update) OVER (PARTITION BY t.grp_close)          AS last_update,
                first_value(t.insert_date) OVER (PARTITION BY t.grp_close)          AS last_insert_date,
                first_value(t.cases) OVER (PARTITION BY t.grp_close)                AS cases,
                first_value(t.cases_per_population) OVER (PARTITION BY t.grp_close) AS cases_per_population,
                first_value(t.cases_per_100k) OVER (PARTITION BY t.grp_close)       AS cases_per_100k,
                first_value(t.population) OVER (PARTITION BY t.grp_close)           AS population,
                first_value(t.deaths) OVER (PARTITION BY t.grp_close)               AS deaths,
                first_value(t.death_rate) OVER (PARTITION BY t.grp_close)           AS death_rate
         FROM (SELECT lk_time_series.ids,
                      lk_time_series.name,
                      lk_time_series.bez,
                      lk_time_series.timestamp,
                      latest_lk_update_per_day.geom,
                      latest_lk_update_per_day.insert_date,
                      latest_lk_update_per_day.last_update,
                      latest_lk_update_per_day.cases,
                      latest_lk_update_per_day.cases_per_population,
                      latest_lk_update_per_day.cases_per_100k,
                      latest_lk_update_per_day.population,
                      latest_lk_update_per_day.deaths,
                      latest_lk_update_per_day.death_rate,
                      sum(
                      CASE
                          WHEN latest_lk_update_per_day.last_update IS NOT NULL THEN 1
                          ELSE NULL::integer
                          END)
                      OVER (ORDER BY lk_time_series.name, lk_time_series.bez, lk_time_series."timestamp") AS grp_close
               FROM lk_time_series
                        LEFT JOIN latest_lk_update_per_day
                                  ON lk_time_series.ids = latest_lk_update_per_day.ids
                                      AND lk_time_series."timestamp" = latest_lk_update_per_day.last_update::date) t
     ),
     bl_agg AS (
         SELECT b.ids,
                b.name,
                filled_lk_timeseries.timestamp,
                MAX(filled_lk_timeseries.last_update)               AS last_update,
                MAX(filled_lk_timeseries.last_insert_date)          AS last_insert_date,
                string_agg(DISTINCT filled_lk_timeseries.name, ',') AS landkreise,
                b.geom,
                SUM(cases)                                          as cases,
                SUM(cases_per_100k)                                 as cases_per_100k,
                AVG(cases_per_population)                           as cases_per_population,
                SUM(population)                                     as population,
                SUM(deaths)                                         as deaths,
                AVG(death_rate)                                     as death_rate

         FROM filled_lk_timeseries
                  LEFT OUTER JOIN bundeslaender b ON filled_lk_timeseries.ids LIKE (b.ids || '%')
         GROUP BY b.ids,
                  b.name,
                  b.geom,
                  filled_lk_timeseries.timestamp
     )
SELECT bl_agg.ids,
       bl_agg.name,
       st_asgeojson(bl_agg.geom) :: json             AS geom,
       st_asgeojson(st_centroid(bl_agg.geom)):: json AS centroid,
       -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
       CASE
           WHEN min(bl_agg.timestamp) IS NULL THEN NULL
           ELSE json_agg(
                   json_build_object(
                           'timestamp',
                           bl_agg.timestamp,
                           'last_update',
                           bl_agg.last_update,
                           'insert_date',
                           bl_agg.last_insert_date,
                           'cases',
                           bl_agg.cases,
                           'cases_per_population',
                           bl_agg.cases_per_population,
                           'cases_per_100k',
                           bl_agg.cases_per_100k,
                           'population',
                           bl_agg.population,
                           'deaths',
                           bl_agg.deaths,
                           'death_rate',
                           bl_agg.death_rate
                       )
                   ORDER BY
                       bl_agg.timestamp
               )
           END                                       AS development,
       CASE
           WHEN min(bl_agg.timestamp) IS NULL THEN NULL
           ELSE json_object_agg(
                   bl_agg.timestamp::date,
                   json_build_object(
                           'timestamp',
                           bl_agg.timestamp,
                           'last_update',
                           bl_agg.last_update,
                           'insert_date',
                           bl_agg.last_insert_date,
                           'cases',
                           bl_agg.cases,
                           'cases_per_population',
                           bl_agg.cases_per_population,
                           'cases_per_100k',
                           bl_agg.cases_per_100k,
                           'population',
                           bl_agg.population,
                           'deaths',
                           bl_agg.deaths,
                           'death_rate',
                           bl_agg.death_rate
                       )
                   ORDER BY
                       bl_agg.timestamp
               )
           END                                       AS developmentDays
FROM bl_agg
GROUP BY bl_agg.ids,
         bl_agg.name,
         bl_agg.geom
    """)

    sql_result = db.engine.execute(sql_stmt).fetchall()

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
