from flask import jsonify
from sqlalchemy import text

from db import db


class CaseDevelopments:
    __buildObj = """
    json_build_object(
        'timestamp',
        agg.timestamp,
        'inserted',
        agg.inserted,
        'last_updated',
        agg.last_updated,
        'cases',
        agg.cases,
        'cases_per_population',
        agg.cases_per_population,
        'cases_per_100k',
        agg.cases_per_100k,
        'population',
        agg.population,
        'deaths',
        agg.deaths,
        'death_rate',
        agg.death_rate,
        'cases7_per_100k',
        agg.cases7_per_100k,
        'beds_total',
        agg.beds_total,
        'beds_occupied',
        agg.beds_occupied,
        'beds_free',
        agg.beds_free,
        'cases_covid',
        agg.cases_covid,
        'cases_covid_ventilated',
        agg.cases_covid_ventilated,
        'num_locations',
        agg.num_locations,
        'num_reporting_areas',
        agg.num_reporting_areas,
        'proportion_beds_free',
        agg.proportion_beds_free,
        'proportion_covid_beds',
        agg.proportion_covid_beds,
        'proportion_covid_ventilated',
        agg.proportion_covid_ventilated,
        'num_counties_reported',
        agg.num_counties_reported,
        'num_counties_total',
        agg.num_counties_total
    )::jsonb
    """

    __aggCols = """
        r.ids                                                               as ids,
        r.name                                                              as name,
        c.timestamp                                                         as timestamp,
        MAX(c.last_updated)                                                 as last_updated,
        MAX(c.inserted)                                                     as inserted,
        string_agg(DISTINCT c.name, ',')                                    as landkreise,
        r.geom                                                              as geom,
        SUM(cases)                                                          as cases,
        SUM(cases_per_100k)                                                 as cases_per_100k,
        AVG(cases_per_population)                                           as cases_per_population,
        SUM(population)                                                     as population,
        SUM(deaths)                                                         as deaths,
        AVG(death_rate)                                                     as death_rate,
        (SUM(cases - cases7_days_ago) / SUM(population)) * 100000           as cases7_per_100k,
        SUM(beds_total)                                                     as beds_total,
        SUM(beds_occupied)                                                  as beds_occupied,
        SUM(beds_free)                                                      as beds_free,
        SUM(cases_covid)                                                    as cases_covid,
        SUM(cases_covid_ventilated)                                         as cases_covid_ventilated,
        SUM(num_locations)                                                  as num_locations,
        SUM(num_reporting_areas)                                            as num_reporting_areas,
        AVG(proportion_beds_free)                                           as proportion_beds_free,
        AVG(proportion_covid_beds)                                          as proportion_covid_beds,
        AVG(proportion_covid_ventilated)                                    as proportion_covid_ventilated,
        SUM((CASE WHEN c.last_updated IS NULL THEN 0 ELSE 1 END))           as num_counties_reported,
        COUNT(*)                                                            as num_counties_total
    """

    def __init__(self, dataTable):
        self.dataTable = dataTable

    def getCounty(self, fromTime, toTime, idCounty):
        """
            Return the development of covid cases and deaths for one county
        """
        return self.__resSingle(self.__getCounties(fromTime, toTime, idCounty))

    def getByCounties(self, fromTime, toTime):
        """
            Return the development of covid cases and deaths by counties
        """
        return self.__resCollection(self.__getCounties(fromTime, toTime, None))

    def getDistrict(self, fromTime, toTime, idDistrict):
        """
            Return the development of covid cases and deaths for one district
        """
        return self.__resSingle(self.__aggQuery('regierungsbezirke', fromTime, toTime, idDistrict))

    def getByDistricts(self, fromTime, toTime):
        """
            Return the development of covid cases and deaths by districts
        """
        return self.__resCollection(self.__aggQuery('regierungsbezirke', fromTime, toTime, None))

    def getState(self, fromTime, toTime, idState):
        """
            Return the development of covid cases and deaths for one state
        """
        return self.__resSingle(self.__aggQuery('bundeslaender', fromTime, toTime, idState))

    def getByStates(self, fromTime, toTime):
        """
            Return the development of covid cases and deaths by states
        """
        return self.__resCollection(self.__aggQuery('bundeslaender', fromTime, toTime, None))

    def getCountry(self, fromTime, toTime, idCountry):
        """
            Return the development of covid cases and deaths for one country
        """
        return self.__resSingle(self.__aggQuery('germany', fromTime, toTime, idCountry))

    def getByCountries(self, fromTime, toTime):
        """
            Return the development of covid cases and deaths by countries
        """
        return self.__resCollection(self.__aggQuery('germany', fromTime, toTime, None))

    @staticmethod
    def __resCollection(sql_stmt):
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

    @staticmethod
    def __resSingle(sql_stmt):
        r = db.engine.execute(sql_stmt).fetchone()

        if r is None:
            return jsonify({'error': 'not found'}), 404

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

        return feature

    def __aggQuery(self, aggTable, fromTime, toTime, idObj):

        sqlFromTime = ""
        sqlToTime = ""
        sqlIdObj = ""

        if fromTime:
            sqlFromTime = f"AND agg.timestamp >= '{fromTime}'"

        if toTime:
            sqlToTime = f"AND agg.timestamp <= '{toTime}'"

        if idObj:
            sqlIdObj = f"AND agg.ids = '{idObj}'"

        return text("""
        WITH agg AS (
            SELECT {development_select_cols}
            FROM {dataTable} c
            LEFT OUTER JOIN {aggTable} r ON (c.ids LIKE (r.ids || '%') OR r.ids = 'de')
            GROUP BY r.ids,
                    r.name,
                    r.geom,
                    c.timestamp
        )
        SELECT agg.ids,
            agg.name,
            '' as description,
            st_asgeojson(agg.geom) :: jsonb             AS geom,
            st_asgeojson(st_centroid(agg.geom)):: jsonb AS centroid,
            -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_agg(
                        {development_json_build_obj}
                        ORDER BY
                            agg.timestamp
                    )::jsonb
                END                                       AS development,
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_object_agg(
                        agg.timestamp::date,
                        {development_json_build_obj}
                        ORDER BY
                            agg.timestamp
                    )::jsonb
                END                                       AS developmentDays
        FROM agg
        WHERE 1 = 1
            {sqlFromTime}
            {sqlToTime}
            {sqlIdObj}
        GROUP BY agg.ids,
                agg.name,
                agg.geom
        """.format(aggTable=aggTable, development_select_cols=self.__aggCols,
                   development_json_build_obj=self.__buildObj, dataTable=self.dataTable, sqlFromTime=sqlFromTime,
                   sqlToTime=sqlToTime, sqlIdObj=sqlIdObj))

    def __getCounties(self, fromTime, toTime, idCounty):
        """
            Return the development of covid cases and deaths
            by counties
        """

        sqlFromTime = ""
        sqlToTime = ""
        sqlIdCounty = ""

        if fromTime:
            sqlFromTime = f"AND agg.timestamp >= '{fromTime}'"

        if toTime:
            sqlToTime = f"AND agg.timestamp <= '{toTime}'"

        if idCounty:
            sqlIdCounty = f"AND agg.ids = '{idCounty}'"

        sql_stmt = text("""
            SELECT
                agg.ids,
                agg.name,
                agg."desc" AS description,
                st_asgeojson(agg.geom) :: jsonb AS geom,
                st_asgeojson(st_centroid(agg.geom)):: jsonb AS centroid,
                -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
                CASE
                    WHEN min(agg.timestamp) IS NULL THEN NULL
                    ELSE json_agg(
                        {buildObj}
                        ORDER BY
                            agg.timestamp
                    )::jsonb
                END AS development,
                CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_object_agg(
                    agg.timestamp::date,
                    {buildObj}
                    ORDER BY
                        agg.timestamp
                )::jsonb
            END AS developmentDays
            FROM
                (
                    SELECT *, 1 as num_counties_reported, 1 as num_counties_total
                    FROM {dataTable}
                ) agg
            WHERE 1 = 1
                {sqlFromTime}
                {sqlToTime}
                {sqlIdCounty}
            GROUP BY
                agg.ids,
                agg.name,
                agg."desc",
                agg.geom
        """.format(buildObj=self.__buildObj, dataTable=self.dataTable, sqlFromTime=sqlFromTime, sqlToTime=sqlToTime,
                   sqlIdCounty=sqlIdCounty))

        # current_app.logger.debug(f'Counties: {sql_stmt}')

        return sql_stmt
