from sqlalchemy import text
from db import db
from flask import jsonify, current_app

class IcuDevelopments:

    __buildObj = """
    json_build_object(
        'timestamp',
        agg.timestamp,
        'inserted',
        agg.last_insert_date,
        'last_updated',
        agg.last_update,
        'num_hospitals',
        agg.num_hospitals,
        'icu_low_state',
        json_build_object(
            'Verfügbar',
            icu_low_v,
            'Begrenzt',
            icu_low_b,
            'Ausgelastet',
            icu_low_a,
            'Nicht verfügbar',
            icu_low_nv
        ),
        'icu_high_state',
        json_build_object(
            'Verfügbar',
            icu_high_v,
            'Begrenzt',
            icu_high_b,
            'Ausgelastet',
            icu_high_a,
            'Nicht verfügbar',
            icu_high_nv
        ),
        'ecmo_state',
        json_build_object(
            'Verfügbar',
            ecmo_v,
            'Begrenzt',
            ecmo_b,
            'Ausgelastet',
            ecmo_a,
            'Nicht verfügbar',
            ecmo_nv
        )
    )::jsonb
    """

    __aggCols = """
        r.ids                            as ids,
        r.name                           as name,
        c.timestamp                      as timestamp,
        MAX(c.last_update)               as last_update,
        MAX(c.last_insert_date)          as last_insert_date,
        r.geom                           as geom,
        SUM(icu_low_v)                   as icu_low_v,
        SUM(icu_low_b)                   as icu_low_b,
        SUM(icu_low_a)                   as icu_low_a,
        SUM(icu_low_nv)                  as icu_low_nv,
        SUM(icu_high_v)                  as icu_high_v,
        SUM(icu_high_b)                  as icu_high_b,
        SUM(icu_high_a)                  as icu_high_a,
        SUM(icu_high_nv)                 as icu_high_nv,
        SUM(ecmo_v)                      as ecmo_v,
        SUM(ecmo_b)                      as ecmo_b,
        SUM(ecmo_a)                      as ecmo_a,
        SUM(ecmo_nv)                     as ecmo_nv,
        COUNT(r.ids)                     as num_hospitals
    """

    def getHospital(self, fromTime, toTime, maxDaysOld, idHospital):
        """
            Return the development of one hospital
        """
        return self.__resSingle(self.__getHospitals(fromTime, toTime, maxDaysOld, idHospital), fromTime, toTime, maxDaysOld, idHospital, self.__getFeatureHospital)

    def getHospitals(self, fromTime, toTime, maxDaysOld):
        """
            Return the development of all hospital
        """
        return self.__resCollection(self.__getHospitals(fromTime, toTime, maxDaysOld, None), fromTime, toTime, maxDaysOld, self.__getFeatureHospital)

    def getCounty(self, fromTime, toTime, maxDaysOld, idCounty):
        """
            Return the development of icu capacities for one county
        """
        return self.__resSingle(self.__aggQuery('landkreise_extended', fromTime, toTime, maxDaysOld, idCounty), fromTime, toTime, maxDaysOld, idCounty, self.__getFeatureAgg)
   
    def getByCounties(self, fromTime, toTime, maxDaysOld):
        """
            Return the development of icu capacities by counties
        """
        return self.__resCollection(self.__aggQuery('landkreise_extended', fromTime, toTime, maxDaysOld, None), fromTime, toTime, maxDaysOld, self.__getFeatureAgg)


    def getDistrict(self, fromTime, toTime, maxDaysOld, idDistrict):
        """
            Return the development of icu capacities for one district
        """
        return self.__resSingle(self.__aggQuery('regierungsbezirke', fromTime, toTime, maxDaysOld, idDistrict), fromTime, toTime, maxDaysOld, idDistrict, self.__getFeatureAgg)

    def getByDistricts(self, fromTime, toTime, maxDaysOld):
        """
            Return the development of icu capacities by districts
        """
        return self.__resCollection(self.__aggQuery('regierungsbezirke', fromTime, toTime, maxDaysOld, None), fromTime, toTime, maxDaysOld, self.__getFeatureAgg)


    def getState(self, fromTime, toTime, maxDaysOld, idState):
        """
            Return the development of icu capacities for one state
        """
        return self.__resSingle(self.__aggQuery('bundeslaender', fromTime, toTime, maxDaysOld, idState), fromTime, toTime, maxDaysOld, idState, self.__getFeatureAgg)

    def getByStates(self, fromTime, toTime, maxDaysOld):
        """
            Return the development of icu capacities by states
        """
        return self.__resCollection(self.__aggQuery('bundeslaender', fromTime, toTime, maxDaysOld, None), fromTime, toTime, maxDaysOld, self.__getFeatureAgg)

    def getCountry(self, fromTime, toTime, maxDaysOld, idCountry):
        """
            Return the development of icu capacities for one country
        """
        return self.__resSingle(self.__aggQuery('germany', fromTime, toTime, maxDaysOld, idCountry), fromTime, toTime, maxDaysOld, idCountry, self.__getFeatureAgg)
    
    def getByCountries(self, fromTime, toTime, maxDaysOld):
        """
            Return the development of icu capacities by countries
        """
        return self.__resCollection(self.__aggQuery('germany', fromTime, toTime, maxDaysOld, None), fromTime, toTime, maxDaysOld, self.__getFeatureAgg)

    def __getFeatureHospital(self, r):
        # agg.id,
        # agg.name,
        # agg.address,
        # agg.state,
        # agg.contact,
        # agg.helipad_nearby,
        # st_asgeojson(agg.location) :: jsonb AS geom,
        # CASE
        #     WHEN min(agg.timestamp) IS NULL THEN NULL
        #     ELSE json_agg(
        #         {buildObj}
        #         ORDER BY
        #             agg.timestamp
        #     )::jsonb
        # END AS development
        return {
            "type": 'Feature',
            "geometry": r[6],
            "properties": {
                "id": r[0],
                "name": r[1],
                "address": r[2],
                "contact": r[4],
                "helipad_nearby": r[5],
                "developments": r[7]
            }
        }



    def __resCollection(self, sql_stmt, fromTime, toTime, maxDaysOld, cb):
        sql_result = db.engine.execute(sql_stmt, fromTime = fromTime, toTime = toTime, maxDaysOld = maxDaysOld).fetchall()

        features = []
        for r in sql_result:
            feature = cb(r)
            features.append(feature)

        featurecollection = {"type": "FeatureCollection", "features": features}

        return jsonify(featurecollection), 200

    def __resSingle(self, sql_stmt, fromTime, toTime, maxDaysOld, idHospital, cb):
        r = db.engine.execute(sql_stmt, fromTime = fromTime, toTime = toTime, maxDaysOld = maxDaysOld, idObj = idHospital).fetchone()

        if r is None:
            return jsonify({'error': 'not found'}), 404

        feature = cb(r)


        return jsonify(feature), 200



    def __getFeatureAgg(self, r):
        # agg.ids,
        #     agg.name,
        #     st_asgeojson(agg.geom) :: jsonb             AS geom,
        #     st_asgeojson(st_centroid(agg.geom)):: jsonb AS centroid,
        #     AS development,
        #     AS developmentDays
        return {
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

    

    def __aggQuery(self, aggTable, fromTime, toTime, maxDaysOld, idObj):

        sqlFromTime = ""
        sqlToTime = ""
        sqlMaxDaysOld = ""
        sqlIdObj = ""

        if fromTime:
            sqlFromTime = "AND agg.timestamp >= :fromTime"

        if toTime:
            sqlToTime = "AND agg.timestamp <= :toTime"

        if maxDaysOld:
            sqlMaxDaysOld = "AND c.age <= (:maxDaysOld || ' days') ::interval"

        if idObj:
            sqlIdObj = "AND agg.ids = :idObj"

        stmnt = text("""
        WITH agg AS (
            SELECT {aggCols}
            FROM filled_hospital_timeseries_with_fix c
            JOIN {aggTable} r ON st_contains(r.geom, c.geom)
            WHERE landkreis_id IS NOT NULL
                {sqlMaxDaysOld}
            GROUP BY r.ids,
                    r.name,
                    r.geom,
                    c.timestamp
        )
        SELECT agg.ids,
            agg.name,
            st_asgeojson(agg.geom) :: jsonb             AS geom,
            st_asgeojson(st_centroid(agg.geom)):: jsonb AS centroid,
            -- check if the first value is null, can ONLY happen if there are no values for the landkreis, then we return null
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_agg(
                        {buildObj}
                        ORDER BY
                            agg.timestamp
                    )::jsonb
                END                                       AS development,
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_object_agg(
                        agg.timestamp::date,
                        {buildObj}
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
        """.format(aggTable=aggTable, aggCols=self.__aggCols, buildObj=self.__buildObj, sqlFromTime = sqlFromTime, sqlToTime = sqlToTime, sqlMaxDaysOld = sqlMaxDaysOld, sqlIdObj = sqlIdObj))

        current_app.logger.debug(stmnt)

        return stmnt


    def __getHospitals(self, fromTime, toTime, maxDaysOld, idHospital):
        """
            Return the development of icu capacities
            by counties
        """

        sqlFromTime = ""
        sqlToTime = ""
        sqlMaxDaysOld = ""
        sqlIdCounty = ""

        if fromTime:
            sqlFromTime = "AND agg.timestamp >= :fromTime"

        if toTime:
            sqlToTime = "AND agg.timestamp <= :toTime"

        if maxDaysOld:
            sqlMaxDaysOld = "AND agg.age <= (:maxDaysOld || ' days') ::interval"

        if idHospital:
            sqlIdCounty = "AND agg.id = :idObj"

        sql_stmt = text("""
            SELECT
                agg.hospital_id,
                agg.name,
                agg.address,
                agg.state,
                agg.contact,
                agg.helipad_nearby,
                st_asgeojson(agg.geom) :: jsonb AS geom,
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
                END                                       AS developmentDays
            FROM
                (SELECT *, 1 AS num_hospitals FROM filled_hospital_timeseries_with_fix) agg
            WHERE landkreis_id IS NOT NULL
                {sqlFromTime}
                {sqlToTime}
                {sqlIdCounty}
                {sqlMaxDaysOld}
            GROUP BY
                agg.hospital_id,
                agg.name,
                agg.address,
                agg.state,
                agg.contact,
                agg.geom,
                agg.helipad_nearby
        """.format(buildObj = self.__buildObj, sqlFromTime = sqlFromTime, sqlToTime = sqlToTime, sqlMaxDaysOld = sqlMaxDaysOld, sqlIdCounty = sqlIdCounty))

        # current_app.logger.debug(f'Counties: {sql_stmt}')

        return sql_stmt
