from sqlalchemy import text
from db import db
from flask import jsonify

class CaseDevelopments:

    __buildObj = """
    json_build_object(
        'timestamp',
        agg.timestamp,
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
        agg.proportion_covid_ventilated
    )
    """

    __aggCols = """
        r.ids,
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
        AVG(cases7_per_100k)                                as cases7_per_100k,
        SUM(beds_total)                                     as beds_total,
        SUM(beds_occupied)                                  as beds_occupied,
        SUM(beds_free)                                      as beds_free,
        SUM(cases_covid)                                    as cases_covid,
        SUM(cases_covid_ventilated)                         as cases_covid_ventilated,
        SUM(num_locations)                                  as num_locations,
        SUM(num_reporting_areas)                            as num_reporting_areas,
        AVG(proportion_beds_free)                           as proportion_beds_free,
        AVG(proportion_covid_beds)                          as proportion_covid_beds,
        AVG(proportion_covid_ventilated)                    as proportion_covid_ventilated
    """


    def __init__(self, dataTable):
        self.dataTable = dataTable

    
    def getByCounties(self):
        """
            Return the development of covid cases and deaths
            by counties
        """
        sql_stmt = text("""
            SELECT
                agg.ids,
                agg.name,
                agg."desc" AS description,
                st_asgeojson(agg.geom) :: json AS geom,
                st_asgeojson(st_centroid(agg.geom)):: json AS centroid,
                -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
                CASE
                    WHEN min(agg.timestamp) IS NULL THEN NULL
                    ELSE json_agg(
                        {buildObj}
                        ORDER BY
                            agg.timestamp
                    )
                END AS development,
                CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_object_agg(
                    agg.timestamp::date,
                    {buildObj}
                    ORDER BY
                        agg.timestamp
                )
            END AS developmentDays
            FROM
                {dataTable} agg
            GROUP BY
                agg.ids,
                agg.name,
                agg."desc",
                agg.geom
        """.format(buildObj=self.__buildObj, dataTable = self.dataTable))

        return self.__res(sql_stmt)


    def getByDistricts(self):
        """
            Return the development of covid cases and deaths
            by districts
        """
        sql_stmt = text(self.__aggQuery('regierungsbezirke'))

        return self.__res(sql_stmt)


    def getByStates(self):
        """
            Return the development of covid cases and deaths
            by states
        """
        sql_stmt = text(self.__aggQuery('bundeslaender'))

        return self.__res(sql_stmt)

    
    def getByCountries(self):
        """
            Return the development of covid cases and deaths
            by countries
        """
        sql_stmt = text(self.__aggQuery('germany'))

        return self.__res(sql_stmt)





    def __res(self, sql_stmt):
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


    

    def __aggQuery(self, aggTable):
        return """
        WITH agg AS (
            SELECT {development_select_cols}
            FROM {dataTable} c
            LEFT OUTER JOIN {aggTable} r ON c.ids LIKE (r.ids || '%')
            GROUP BY r.ids,
                    r.name,
                    r.geom,
                    c.timestamp
        )
        SELECT agg.ids,
            agg.name,
            '' as description,
            st_asgeojson(agg.geom) :: json             AS geom,
            st_asgeojson(st_centroid(agg.geom)):: json AS centroid,
            -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_agg(
                        {development_json_build_obj}
                        ORDER BY
                            agg.timestamp
                    )
                END                                       AS development,
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_object_agg(
                        agg.timestamp::date,
                        {development_json_build_obj}
                        ORDER BY
                            agg.timestamp
                    )
                END                                       AS developmentDays
        FROM agg
        GROUP BY agg.ids,
                agg.name,
                agg.geom
        """.format(aggTable=aggTable, development_select_cols=self.__aggCols, development_json_build_obj=self.__buildObj, dataTable=self.dataTable)
