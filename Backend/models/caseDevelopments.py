import re

from flask import jsonify
from sqlalchemy import text

from db import db


class CaseDevelopments:
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

    def getAggregated(self, aggDict: dict, fromTime: str, toTime: str):
        return self.__resSingle(self.__aggRegionQuery(aggDict, fromTime, toTime))

    @staticmethod
    def __resCollection(sql_ret):
        sql_result = sql_ret.fetchall()
        # sql_result = db.engine.execute(sql_stmt).fetchall()

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
    def __resSingle(sql_ret):
        r = sql_ret.fetchone()

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

    def __buildObj(self):
        ageStuff = ""
        if self.dataTable == 'cases_per_county_and_day':
            ageStuff = """
                ,
                'cases_by_agegroup',
                json_build_object(
                    'A00_A04',
                    agg."c_A00-A04",
                    'A05_A14',
                    agg."c_A05-A14",
                    'A15_A34',
                    agg."c_A15-A34",
                    'A35_A59',
                    agg."c_A35-A59",
                    'A60_A79',
                    agg."c_A60-A79",
                    'A80plus',
                    agg."c_A80+",
                    'Aunknown',
                    agg."c_Aunbekannt"
                )::jsonb,
                'deaths_by_agegroup',
                json_build_object(
                    'A00_A04',
                    agg."d_A00-A04",
                    'A05_A14',
                    agg."d_A05-A14",
                    'A15_A34',
                    agg."d_A15-A34",
                    'A35_A59',
                    agg."d_A35-A59",
                    'A60_A79',
                    agg."d_A60-A79",
                    'A80plus',
                    agg."d_A80+",
                    'Aunknown',
                    agg."d_Aunbekannt"
                )::jsonb,
                'population_by_agegroup',
                json_build_object(
                    'A00_A04',
                    agg."p_A00-A04",
                    'A05_A14',
                    agg."p_A05-A14",
                    'A15_A34',
                    agg."p_A15-A34",
                    'A35_A59',
                    agg."p_A35-A59",
                    'A60_A79',
                    agg."p_A60-A79",
                    'A80plus',
                    agg."p_A80+"
                )::jsonb
            """

        ret = f"""
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
                {ageStuff}   
            )::jsonb
            """
        return ret

    def __aggCols(self, region_agg: bool):
        ageStuff = ""
        if self.dataTable == 'cases_per_county_and_day':
            ageStuff = """
                ,
                SUM(c."c_A00-A04")                                            as "c_A00-A04",
                SUM(c."c_A05-A14")                                            as "c_A05-A14",
                SUM(c."c_A15-A34")                                            as "c_A15-A34",
                SUM(c."c_A35-A59")                                            as "c_A35-A59",
                SUM(c."c_A60-A79")                                            as "c_A60-A79",
                SUM(c."c_A80+")                                               as "c_A80+",
                SUM(c."c_Aunbekannt")                                         as "c_Aunbekannt",
                SUM(c."d_A00-A04")                                            as "d_A00-A04",
                SUM(c."d_A05-A14")                                            as "d_A05-A14",
                SUM(c."d_A15-A34")                                            as "d_A15-A34",
                SUM(c."d_A35-A59")                                            as "d_A35-A59",
                SUM(c."d_A60-A79")                                            as "d_A60-A79",
                SUM(c."d_A80+")                                               as "d_A80+",
                SUM(c."d_Aunbekannt")                                         as "d_Aunbekannt",
                SUM(c."p_A00-A04")                                            as "p_A00-A04",
                SUM(c."p_A05-A14")                                            as "p_A05-A14",
                SUM(c."p_A15-A34")                                            as "p_A15-A34",
                SUM(c."p_A35-A59")                                            as "p_A35-A59",
                SUM(c."p_A60-A79")                                            as "p_A60-A79",
                SUM(c."p_A80+")                                               as "p_A80+"
            """

        if region_agg:
            r = """
            array_agg(DISTINCT r.ids)                                           as ids,
            array_agg(DISTINCT (r.description || ' ' || r.name))                                          as name,
            array_agg(DISTINCT r.description)                                   as desc,
            st_union(DISTINCT r.geom)                                           as geom,
            """
        else:
            r = """
            r.ids                                                               as ids,
            r.name                                                              as name,
            r.geom                                                              as geom,
            """

        ret = f"""
            {r}
            c.timestamp                                                         as timestamp,
            MAX(c.last_updated)                                                 as last_updated,
            MAX(c.inserted)                                                     as inserted,
            string_agg(DISTINCT c.name, ',')                                    as landkreise,
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
            {ageStuff}
        """
        return ret

    def __aggQuery(self, aggTable, fromTime, toTime, idObj):

        sqlFromTime = ""
        sqlToTime = ""
        sqlIdObj = ""

        if fromTime:
            sqlFromTime = f"AND agg.timestamp >= :fromTimeParam"

        if toTime:
            sqlToTime = f"AND agg.timestamp <= :toTimeParam"

        if idObj:
            sqlIdObj = f"AND agg.ids = :idParam"

        sql_stmt = text("""
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
        """.format(aggTable=aggTable, development_select_cols=self.__aggCols(region_agg=False),
                   development_json_build_obj=self.__buildObj(), dataTable=self.dataTable, sqlFromTime=sqlFromTime,
                   sqlToTime=sqlToTime, sqlIdObj=sqlIdObj))

        # current_app.logger.debug(f'Counties: {sql_stmt}')

        return db.engine.execute(sql_stmt,
                                 fromTimeParam=fromTime,
                                 toTimeParam=toTime,
                                 idParam=idObj
                                 )

    def __getCounties(self, fromTime, toTime, idCounty):
        """
            Return the development of covid cases and deaths
            by counties
        """

        sqlFromTime = ""
        sqlToTime = ""
        sqlIdCounty = ""

        if fromTime:
            sqlFromTime = f"AND agg.timestamp >= :fromTimeParam"

        if toTime:
            sqlToTime = f"AND agg.timestamp <= :toTimeParam"

        if idCounty:
            sqlIdCounty = f"AND agg.ids = :idParam"

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
        """.format(buildObj=self.__buildObj(), dataTable=self.dataTable, sqlFromTime=sqlFromTime, sqlToTime=sqlToTime,
                   sqlIdCounty=sqlIdCounty))

        # current_app.logger.debug(f'Counties: {sql_stmt}')

        return db.engine.execute(sql_stmt,
                                 fromTimeParam=fromTime,
                                 toTimeParam=toTime,
                                 idParam=idCounty
                                 )


    def __aggRegionQuery(self, aggTableDict, fromTime, toTime):

        sqlFromTime = ""
        sqlToTime = ""

        sqlJoinUnion = []

        regex = re.compile(r"[^0-9]", re.IGNORECASE)

        allIds = []

        number_of_ids = 0
        ids: str
        for aggTable, ids in aggTableDict.items():
            if ids is None:
                continue
            ids_sanitized = list(map(lambda d: re.sub(regex, "", d.strip()), ids.split(",")))
            number_of_ids += len(ids_sanitized)
            allIds += ids_sanitized

            ids_sanitized_sql = "('" + ("', '".join(ids_sanitized)) + "')"

            desc = ''
            if aggTable == 'landkreise':
                aggTable = 'landkreise_extended'
                desc = "bez AS description"
            elif aggTable == 'regierungsbezirke':
                desc = "'RB' AS description"
            elif aggTable == 'bundeslaender':
                desc = "'BL' AS description"
            elif aggTable == 'laender':
                desc = "'L' AS description"

            sqlJoinUnion += [(f"SELECT ids, geom, name, {desc} FROM {aggTable} WHERE ids IN {ids_sanitized_sql}")]



        sqlJoins = " ( " + (" UNION ".join(sqlJoinUnion)) + " ) AS r"

        if fromTime:
            sqlFromTime = f"AND agg.timestamp >= :fromTimeParam"

        if toTime:
            sqlToTime = f"AND agg.timestamp <= :toTimeParam"


        allIdsSql = "('" + ("', '".join(allIds)) + "')"
        sqlIdObj = f"AND r.ids IN {allIdsSql}"

        sql_stmt = text("""
        WITH agg AS (
            SELECT {development_select_cols}
            FROM {dataTable} c
            JOIN {sqlJoins} ON (c.ids LIKE (r.ids || '%') OR r.ids = 'de')
            WHERE 1=1
            {sqlIdObj}
            GROUP BY c.timestamp
            HAVING COUNT(DISTINCT r.ids) = {number_of_ids}
        )
        SELECT agg.ids,
            agg.name,
            agg.desc,
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
        GROUP BY agg.ids,
                agg.name,
                agg.geom,
                agg.desc
        """.format(aggTable=aggTable, development_select_cols=self.__aggCols(region_agg=True),
                   development_json_build_obj=self.__buildObj(), dataTable=self.dataTable, sqlFromTime=sqlFromTime,
                   sqlToTime=sqlToTime, sqlIdObj=sqlIdObj, sqlJoins=sqlJoins, number_of_ids=number_of_ids))

        # current_app.logger.debug(f'Agg Regions: {sql_stmt}')

        # return sql_stmt
        return db.engine.execute(sql_stmt,
                                 fromTimeParam=fromTime,
                                 toTimeParam=toTime
                                 )
