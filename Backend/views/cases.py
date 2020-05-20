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
SELECT
    c.ids,
    c.name,
    c."desc" AS description,
    st_asgeojson(c.geom) :: json AS geom,
    st_asgeojson(st_centroid(c.geom)):: json AS centroid,
    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
    CASE
        WHEN min(c.timestamp) IS NULL THEN NULL
        ELSE json_agg(
            json_build_object(
                'timestamp',
                c.timestamp,
                'cases',
                c.cases,
                'cases_per_population',
                c.cases_per_population,
                'cases_per_100k',
                c.cases_per_100k,
                'population',
                c.population,
                'deaths',
                c.deaths,
                'death_rate',
                c.death_rate,
                'cases7_per_100k',
                c.cases7_per_100k
            )
            ORDER BY
                c.timestamp
        )
    END AS development,
    CASE
    WHEN min(c.timestamp) IS NULL THEN NULL
    ELSE json_object_agg(
        c.timestamp::date,
        json_build_object(
            'timestamp',
            c.timestamp,
            'cases',
            c.cases,
            'cases_per_population',
            c.cases_per_population,
            'cases_per_100k',
            c.cases_per_100k,
            'population',
            c.population,
            'deaths',
            c.deaths,
            'death_rate',
            c.death_rate,
            'cases7_per_100k',
            c.cases7_per_100k
        )
        ORDER BY
            c.timestamp
    )
END AS developmentDays
FROM
    cases_per_county_and_day c
GROUP BY
    c.ids,
    c.name,
    c."desc",
    c.geom
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
WITH rb_agg AS (
         SELECT r.ids,
                r.name,
                c.timestamp,
                string_agg(DISTINCT c.name, ',') AS landkreise,
                r.geom,
                SUM(cases)                                          as cases,
                SUM(cases_per_100k)                                 as cases_per_100k,
                AVG(cases_per_population)                           as cases_per_population,
                SUM(population)                                     as population,
                SUM(deaths)                                         as deaths,
                AVG(death_rate)                                     as death_rate,
                AVG(cases7_per_100k)                                as cases7_per_100k

         FROM cases_per_county_and_day c
                  LEFT OUTER JOIN regierungsbezirke r ON c.ids LIKE (r.ids || '%')
         GROUP BY r.ids,
                  r.name,
                  r.geom,
                  c.timestamp
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
                           rb_agg.death_rate,
                            'cases7_per_100k',
                            rb_agg.cases7_per_100k
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
                           rb_agg.death_rate,
                            'cases7_per_100k',
                            rb_agg.cases7_per_100k
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
WITH bl_agg AS (
         SELECT b.ids,
                b.name,
                c.timestamp,
                string_agg(DISTINCT c.name, ',') AS landkreise,
                b.geom,
                SUM(cases)                                          as cases,
                SUM(cases_per_100k)                                 as cases_per_100k,
                AVG(cases_per_population)                           as cases_per_population,
                SUM(population)                                     as population,
                SUM(deaths)                                         as deaths,
                AVG(death_rate)                                     as death_rate,
                AVG(cases7_per_100k)                                as cases7_per_100k

         FROM cases_per_county_and_day c
                  LEFT OUTER JOIN bundeslaender b ON c.ids LIKE (b.ids || '%')
         GROUP BY b.ids,
                  b.name,
                  b.geom,
                  c.timestamp
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
                           bl_agg.death_rate,
                            'cases7_per_100k',
                            bl_agg.cases7_per_100k
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
                           bl_agg.death_rate,
                            'cases7_per_100k',
                            bl_agg.cases7_per_100k
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


@routes.route('/development/laender', methods=['GET'])
@cache.cached()
def get_cases_development_by_countries():
    """
        Return the development of covid cases and deaths
        by countries
    """
    sql_stmt = text("""
WITH bl_agg AS (
         SELECT g.ids,
                g.name,
                c.timestamp,
                string_agg(DISTINCT c.name, ',') AS landkreise,
                g.geom,
                SUM(cases)                                          as cases,
                SUM(cases_per_100k)                                 as cases_per_100k,
                AVG(cases_per_population)                           as cases_per_population,
                SUM(population)                                     as population,
                SUM(deaths)                                         as deaths,
                AVG(death_rate)                                     as death_rate,
                AVG(cases7_per_100k)                                as cases7_per_100k

         FROM cases_per_county_and_day c
         CROSS JOIN germany g
         GROUP BY g.ids,
                  g.name,
                  g.geom,
                  c.timestamp
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
                           bl_agg.death_rate,
                            'cases7_per_100k',
                            bl_agg.cases7_per_100k
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
                           bl_agg.death_rate,
                            'cases7_per_100k',
                            bl_agg.cases7_per_100k
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
