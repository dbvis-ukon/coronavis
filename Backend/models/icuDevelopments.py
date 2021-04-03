import re

from flask import jsonify
from sqlalchemy import text

from db import db


class IcuDevelopments:
    __build_obj = """
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

    __agg_cols = """
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

    def get_hospital(self, from_time, to_time, max_days_old, id_hospital):
        """
            Return the development of one hospital
        """
        return self.__res_single(self.__get_hospitals(from_time, to_time, max_days_old, id_hospital),
                                 from_time, to_time, max_days_old, id_hospital, self.__get_feature_hospital)

    def get_hospitals(self, from_time, to_time, max_days_old):
        """
            Return the development of all hospital
        """
        return self.__res_collection(self.__get_hospitals(from_time, to_time, max_days_old, None), from_time, to_time,
                                     max_days_old, self.__get_feature_hospital)

    def get_county(self, from_time, to_time, max_days_old, id_county):
        """
            Return the development of icu capacities for one county
        """
        return self.__res_single(self.__agg_query('landkreise_extended', from_time, to_time, max_days_old, id_county),
                                 from_time, to_time, max_days_old, id_county, self.__get_feature_agg)

    def get_by_counties(self, from_time, to_time, max_days_old):
        """
            Return the development of icu capacities by counties
        """
        return self.__res_collection(self.__agg_query('landkreise_extended', from_time, to_time, max_days_old, None),
                                     from_time, to_time, max_days_old, self.__get_feature_agg)

    def get_district(self, from_time, to_time, max_days_old, id_district):
        """
            Return the development of icu capacities for one district
        """
        return self.__res_single(self.__agg_query('regierungsbezirke', from_time, to_time, max_days_old, id_district),
                                 from_time, to_time, max_days_old, id_district, self.__get_feature_agg)

    def get_by_districts(self, from_time, to_time, max_days_old):
        """
            Return the development of icu capacities by districts
        """
        return self.__res_collection(self.__agg_query('regierungsbezirke', from_time, to_time, max_days_old, None),
                                     from_time, to_time, max_days_old, self.__get_feature_agg)

    def get_state(self, from_time, to_time, max_days_old, id_state):
        """
            Return the development of icu capacities for one state
        """
        return self.__res_single(self.__agg_query('bundeslaender', from_time, to_time, max_days_old, id_state),
                                 from_time, to_time, max_days_old, id_state, self.__get_feature_agg)

    def get_by_states(self, from_time, to_time, max_days_old):
        """
            Return the development of icu capacities by states
        """
        return self.__res_collection(self.__agg_query('bundeslaender', from_time, to_time, max_days_old, None),
                                     from_time, to_time, max_days_old, self.__get_feature_agg)

    def get_country(self, from_time, to_time, max_days_old, id_country):
        """
            Return the development of icu capacities for one country
        """
        return self.__res_single(self.__agg_query('germany', from_time, to_time, max_days_old, id_country),
                                 from_time, to_time, max_days_old, id_country, self.__get_feature_agg)

    def get_by_countries(self, from_time, to_time, max_days_old):
        """
            Return the development of icu capacities by countries
        """
        return self.__res_collection(self.__agg_query('germany', from_time, to_time, max_days_old, None),
                                     from_time, to_time, max_days_old, self.__get_feature_agg)

    def get_aggregated(self, agg_dict: dict, from_time: str, to_time: str):
        return self.__res_single(sql_stmt=self.__agg_region_query(agg_dict, from_time, to_time),
                                 from_time=from_time, to_time=to_time, max_days_old=5, cb=self.__get_feature_agg,
                                 id_hospital=None)

    @staticmethod
    def __get_feature_hospital(r):
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

    @staticmethod
    def __res_collection(sql_stmt, from_time, to_time, max_days_old, cb):
        sql_result = db.engine.execute(sql_stmt, from_time=from_time, to_time=to_time, max_days_old=max_days_old)\
            .fetchall()

        features = []
        for r in sql_result:
            feature = cb(r)
            features.append(feature)

        featurecollection = {"type": "FeatureCollection", "features": features}

        return jsonify(featurecollection), 200

    @staticmethod
    def __res_single(sql_stmt, from_time, to_time, max_days_old, id_hospital, cb):
        r = db.engine.execute(sql_stmt, from_time=from_time, to_time=to_time, max_days_old=max_days_old,
                              id_obj=id_hospital).fetchone()

        if r is None:
            return jsonify({'error': 'not found'}), 404

        feature = cb(r)

        return jsonify(feature), 200

    @staticmethod
    def __get_feature_agg(r):
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

    @staticmethod
    def __get_agg_cols(show_region=True):
        region_cols = ""
        if show_region:
            region_cols = """
                r.ids                            as ids,
                r.name                           as name,
                r.geom                           as geom,
            """
        return f"""
                {region_cols}
                c.timestamp                      as timestamp,
                MAX(c.last_update)               as last_update,
                MAX(c.last_insert_date)          as last_insert_date,
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
                COUNT(c.hospital_id)             as num_hospitals
            """

    def __agg_query(self, agg_table, from_time, to_time, max_days_old, id_obj):

        sql_from_time = ""
        sql_to_time = ""
        sql_max_days_old = ""
        sql_id_obj = ""

        if from_time:
            sql_from_time = "AND agg.timestamp >= :from_time"

        if to_time:
            sql_to_time = "AND agg.timestamp <= :to_time"

        if max_days_old:
            sql_max_days_old = "AND c.age <= (:max_days_old || ' days') ::interval"

        if id_obj:
            sql_id_obj = "AND agg.ids = :id_obj"

        # noinspection SqlResolve
        stmnt = text("""
        WITH agg AS (
            SELECT {agg_cols}
            FROM filled_hospital_timeseries_with_fix c
            JOIN {agg_table} r ON st_contains(r.geom, c.geom)
            WHERE landkreis_id IS NOT NULL
                {sql_max_days_old}
            GROUP BY r.ids,
                    r.name,
                    r.geom,
                    c.timestamp
        )
        SELECT agg.ids,
            agg.name,
            st_asgeojson(agg.geom) :: jsonb             AS geom,
            st_asgeojson(st_centroid(agg.geom)):: jsonb AS centroid,
            -- check if the first value is null, can ONLY happen if there are no values for the landkreis, 
            -- then we return null
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_agg(
                        {build_obj}
                        ORDER BY
                            agg.timestamp
                    )::jsonb
                END                                       AS development,
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_object_agg(
                        agg.timestamp::date,
                        {build_obj}
                        ORDER BY
                            agg.timestamp
                    )::jsonb
                END                                       AS developmentDays
        FROM agg
        WHERE 1 = 1
            {sql_from_time}
            {sql_to_time}
            {sql_id_obj}
        GROUP BY agg.ids,
                agg.name,
                agg.geom
        """.format(agg_table=agg_table, agg_cols=self.__agg_cols, build_obj=self.__build_obj,
                   sql_from_time=sql_from_time, sql_to_time=sql_to_time, sql_max_days_old=sql_max_days_old,
                   sql_id_obj=sql_id_obj))

        # current_app.logger.debug(stmnt)

        return stmnt

    def __get_hospitals(self, from_time, to_time, max_days_old, id_hospital):
        """
            Return the development of icu capacities
            by counties
        """

        sql_from_time = ""
        sql_to_time = ""
        sql_max_days_old = ""
        sql_id_county = ""

        if from_time:
            sql_from_time = "AND agg.timestamp >= :from_time"

        if to_time:
            sql_to_time = "AND agg.timestamp <= :to_time"

        if max_days_old:
            sql_max_days_old = "AND agg.age <= (:max_days_old || ' days') ::interval"

        if id_hospital:
            sql_id_county = "AND agg.hospital_id = :id_obj"

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
                        {build_obj}
                        ORDER BY
                            agg.timestamp
                    )::jsonb
                END AS development,
                CASE
                    WHEN min(agg.timestamp) IS NULL THEN NULL
                    ELSE json_object_agg(
                            agg.timestamp::date,
                            {build_obj}
                            ORDER BY
                                agg.timestamp
                        )::jsonb
                END                                       AS developmentDays
            FROM
                (SELECT *, 1 AS num_hospitals FROM filled_hospital_timeseries_with_fix) agg
            WHERE landkreis_id IS NOT NULL
                {sql_from_time}
                {sql_to_time}
                {sql_id_county}
                {sql_max_days_old}
            GROUP BY
                agg.hospital_id,
                agg.name,
                agg.address,
                agg.state,
                agg.contact,
                agg.geom,
                agg.helipad_nearby
        """.format(build_obj=self.__build_obj, sql_from_time=sql_from_time, sql_to_time=sql_to_time,
                   sql_max_days_old=sql_max_days_old, sql_id_county=sql_id_county))

        # current_app.logger.debug(f'Counties: {sql_stmt}')

        return sql_stmt

    def __agg_region_query(self, agg_table_dict: dict[str, str], from_time: str, to_time: str):

        sql_from_time = ""
        sql_to_time = ""

        sql_join_union = []

        regex = re.compile(r"[^0-9]", re.IGNORECASE)

        all_ids = []

        number_of_ids = 0
        ids: str
        agg_table = ''
        region_filter_arr = []
        for agg_table, ids in agg_table_dict.items():
            if ids is None:
                continue
            ids_sanitized = list(map(lambda d: re.sub(regex, "", d.strip()), ids.split(",")))
            number_of_ids += len(ids_sanitized)
            all_ids += ids_sanitized

            ids_sanitized_sql = "('" + ("', '".join(ids_sanitized)) + "')"

            desc = ''
            if agg_table == 'landkreise':
                agg_table = 'landkreise_extended'
                desc = "bez AS description"
                region_filter_arr.append(f'county_id IN {ids_sanitized_sql}')
            elif agg_table == 'regierungsbezirke':
                desc = "'RB' AS description"
                region_filter_arr.append(f'gd_id IN {ids_sanitized_sql}')
            elif agg_table == 'bundeslaender':
                desc = "'BL' AS description"
                region_filter_arr.append(f'state_id IN {ids_sanitized_sql}')
            elif agg_table == 'laender':
                agg_table = 'germany'
                ids_sanitized_sql = '(\'de\')'
                all_ids.append('de')
                region_filter_arr.append(f'country_id IN {ids_sanitized_sql}')
                desc = "'L' AS description"

            # noinspection SqlResolve
            sql_join_union += [f"SELECT ids, geom, name, {desc} FROM {agg_table} WHERE ids IN {ids_sanitized_sql}"]

        sql_joins = " ( " + (" UNION ".join(sql_join_union)) + " ) AS r"
        region_filters = " OR ".join(region_filter_arr)

        if from_time:
            sql_from_time = f"AND agg.timestamp >= :fromTimeParam"

        if to_time:
            sql_to_time = f"AND agg.timestamp <= :toTimeParam"

        all_ids_sql = "('" + ("', '".join(all_ids)) + "')"
        sql_id_obj = f"AND r.ids IN {all_ids_sql}"

        # noinspection SqlResolve
        sql_stmt = text("""
        WITH 
        regions_arr AS (
            SELECT 
                array_agg(DISTINCT r.ids)                                           as ids,
                array_agg(DISTINCT (r.description || ' ' || r.name))                as name,
                array_agg(DISTINCT r.description)                                   as "desc",
                st_union(DISTINCT r.geom)                                           as geom
            FROM {sql_joins}
        ),
        filtered AS (
            SELECT {agg_cols}
            FROM filled_hospital_timeseries_with_fix c
            WHERE {region_filters}
            GROUP BY c.timestamp
        ),
        agg AS (
            SELECT r.ids,
            r.name,
            r.geom,
            c1.*
            FROM filtered c1
            CROSS JOIN regions_arr r
        )
        SELECT agg.ids,
            agg.name,
            st_asgeojson(agg.geom) :: jsonb             AS geom,
            st_asgeojson(st_centroid(agg.geom)):: jsonb AS centroid,
            -- check if the first value is null, can ONLY happen if there are no values for the landkreis, 
            -- then we return null
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_agg(
                        {build_obj}
                        ORDER BY
                            agg.timestamp
                    )::jsonb
                END                                       AS development,
            CASE
                WHEN min(agg.timestamp) IS NULL THEN NULL
                ELSE json_object_agg(
                        agg.timestamp::date,
                        {build_obj}
                        ORDER BY
                            agg.timestamp
                    )::jsonb
                END                                       AS developmentDays
        FROM agg
        WHERE 1 = 1
            {sql_from_time}
            {sql_to_time}
        GROUP BY agg.ids,
                agg.name,
                agg.geom
        """.format(agg_table=agg_table, sql_joins=sql_joins, build_obj=self.__build_obj,
                   agg_cols=self.__get_agg_cols(show_region=False),
                   sql_from_time=sql_from_time, sql_to_time=sql_to_time,
                   number_of_ids=number_of_ids, region_filters=region_filters))

        # current_app.logger.debug(f'Agg Regions: {sql_stmt}')

        # return sql_stmt
        return sql_stmt
