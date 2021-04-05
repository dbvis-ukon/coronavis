import re

from flask import jsonify
from sqlalchemy import text

from db import db


class CaseDevelopments:

    def __init__(self, data_table):
        self.data_table = data_table

    def get_county(self, from_time, to_time, id_county, want_age_groups, want_geom: bool):
        """
            Return the development of covid cases and deaths for one county
        """
        return self.__res_single(self.__get_counties(from_time, to_time, id_county, want_age_groups), want_geom=want_geom)

    def get_by_counties(self, from_time, to_time, want_age_groups, want_geom: bool):
        """
            Return the development of covid cases and deaths by counties
        """
        return self.__res_collection(self.__get_counties(from_time, to_time, None, want_age_groups), want_geom=want_geom)

    def get_district(self, from_time, to_time, id_district, want_age_groups, want_geom: bool):
        """
            Return the development of covid cases and deaths for one district
        """
        return self.__res_single(
            self.__agg_query('gd', 'regierungsbezirke', from_time, to_time, id_district, want_age_groups), want_geom=want_geom)

    def get_by_districts(self, from_time, to_time, want_age_groups, want_geom: bool):
        """
            Return the development of covid cases and deaths by districts
        """
        return self.__res_collection(
            self.__agg_query('gd', 'regierungsbezirke', from_time, to_time, None, want_age_groups), want_geom=want_geom)

    def get_state(self, from_time, to_time, id_state, want_age_groups, want_geom: bool):
        """
            Return the development of covid cases and deaths for one state
        """
        return self.__res_single(
            self.__agg_query('state', 'bundeslaender', from_time, to_time, id_state, want_age_groups), want_geom=want_geom)

    def get_by_states(self, from_time, to_time, want_age_groups, want_geom: bool):
        """
            Return the development of covid cases and deaths by states
        """
        return self.__res_collection(
            self.__agg_query('state', 'bundeslaender', from_time, to_time, None, want_age_groups), want_geom=want_geom)

    def get_country(self, from_time, to_time, id_country, want_age_groups, want_geom: bool):
        """
            Return the development of covid cases and deaths for one country
        """
        return self.__res_single(
            self.__agg_query('country', 'germany', from_time, to_time, id_country, want_age_groups), want_geom=want_geom)

    def get_by_countries(self, from_time, to_time, want_age_groups, want_geom: bool):
        """
            Return the development of covid cases and deaths by countries
        """
        return self.__res_collection(self.__agg_query('country', 'germany', from_time, to_time, None, want_age_groups), want_geom=want_geom)

    def get_aggregated(self, agg_dict: dict, from_time: str, to_time: str, want_age_groups: bool, want_geom: bool):
        return self.__res_single(self.__agg_region_query(agg_dict, from_time, to_time, want_age_groups), want_geom=want_geom)

    @staticmethod
    def __res_collection(sql_ret, want_geom: bool):
        sql_result = sql_ret.fetchall()
        # sql_result = db.engine.execute(sql_stmt).fetchall()

        features = []
        for r in sql_result:
            feature = {
                "type": 'Feature',
                "properties": {
                    "id": r[0],
                    "name": r[1],
                    "description": r[2],
                    "centroid": r[4],
                    "developments": r[5],
                    "developmentDays": r[6]
                }
            }
            if want_geom:
                print('want geom2')
                feature["geometry"] = r[3]
            features.append(feature)

        featurecollection = {"type": "FeatureCollection", "features": features}

        return jsonify(featurecollection), 200

    @staticmethod
    def __res_single(sql_ret, want_geom):
        r = sql_ret.fetchone()

        if r is None:
            return jsonify({'error': 'not found'}), 404

        feature = {
            "type": 'Feature',
            "properties": {
                "id": r[0],
                "name": r[1],
                "description": r[2],
                "centroid": r[4],
                "developments": r[5],
                "developmentDays": r[6]
            }
        }
        if want_geom:
            print('want geom')
            feature["geometry"] = r[3]

        return feature

    def __build_obj(self, county_level=False, want_age_groups=False):
        # agg.num_counties_reported,
        #                 'num_counties_total',
        #                 agg.num_counties_total
        num_counties_reported = 'agg.num_counties_reported' if county_level is False else "'1'"
        num_counties_total = 'agg.num_counties_total' if county_level is False else "'1'"

        age_stuff = ""
        if self.data_table == 'cases_per_county_and_day' and want_age_groups:
            ranges = [[0, 30], [30, 60], [60, 80]]

            c2 = []
            p2 = []
            for r in ranges:
                c2i = "json_build_object("
                p2i = "json_build_object("
                for a in range(r[0], r[1]):
                    c2i += "'A{:02d}', agg.\"c2_A{:02d}\"".format(a, a)
                    p2i += "'A{:02d}', agg.\"p2_A{:02d}\"".format(a, a)
                    if a < r[1] - 1 or r[1] == 80:
                        c2i += ", "
                        p2i += ", "

                if r[1] == 80:
                    c2i += "'A80plus', agg.\"c2_A80+\", "
                    c2i += "'Aunknown', agg.\"c2_AUnbekannt\""
                    p2i += "'A80plus', agg.\"p2_A80+\""

                c2i += ")::jsonb"
                p2i += ")::jsonb"

                c2.append(c2i)
                p2.append(p2i)

            c2str = " || ".join(c2)
            p2str = " || ".join(p2)

            age_stuff = f"""
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
                )::jsonb,
                'cases_survstat_by_agegroup',
                ({c2str})::jsonb,
                'population_survstat_by_agegroup',
                ({p2str})::jsonb
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
                {num_counties_reported},
                'num_counties_total',
                {num_counties_total}
                {age_stuff}   
            )::jsonb
            """
        return ret

    def __agg_cols(self, region_agg: bool):
        age_stuff = ""
        if self.data_table == 'cases_per_county_and_day':
            c2 = ""
            p2 = ""
            for a in range(0, 80):
                c2 += "SUM(c.\"c2_A{:02d}\")                          as \"c2_A{:02d}\",\n".format(a, a)
                p2 += "SUM(c.\"p2_A{:02d}\")                          as \"p2_A{:02d}\",\n".format(a, a)

            c2 += "SUM(c.\"c2_A80+\")                                            as \"c2_A80+\",\n"
            c2 += "SUM(c.\"c2_AUnbekannt\")                                      as \"c2_AUnbekannt\",\n"
            p2 += "SUM(c.\"p2_A80+\")                                            as \"p2_A80+\"\n"

            age_stuff = f"""
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
                SUM(c."p_A80+")                                               as "p_A80+",
                {c2}
                {p2}
            """

        if region_agg:
            r = ""
            # array_agg(DISTINCT r.ids)                                           as ids,
            # array_agg(DISTINCT (r.description || ' ' || r.name))                                          as name,
            # array_agg(DISTINCT r.description)                                   as desc,
            # st_union(DISTINCT r.geom)                                           as geom,
            # """
        else:
            r = ""
            # r.ids                                                               as ids,
            # r.name                                                              as name,
            # r.geom                                                              as geom,
            # """

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
            {age_stuff}
        """
        return ret

    def __agg_query(self, agg_cols_prefix, region_table, from_time, to_time, id_obj, want_age_groups):

        sql_from_time = ""
        sql_to_time = ""
        sql_id_obj = ""

        if from_time:
            sql_from_time = f"AND agg.timestamp >= :fromTimeParam"

        if to_time:
            sql_to_time = f"AND agg.timestamp <= :toTimeParam"

        if id_obj:
            sql_id_obj = f"AND agg.ids = :idParam"

        # noinspection SqlResolve
        sql_stmt = text("""
        WITH pre_agg AS (
            SELECT {development_select_cols}, {agg_cols_prefix}_id
            FROM {dataTable} c
            GROUP BY {agg_cols_prefix}_id,
                    c.timestamp
        ),
        agg as (
            SELECT *
            FROM pre_agg
            JOIN {region_table} r ON r.ids = pre_agg.{agg_cols_prefix}_id
        )
        SELECT agg.ids,
            agg.name,
            '' as description,
            st_asgeojson(agg.geom) :: jsonb             AS geom,
            st_asgeojson(st_centroid(agg.geom)):: jsonb AS centroid,
            -- check if the first value is null, can ONLY happen if there are no values for the landkreis, 
            -- then we return null
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
            {sql_from_time}
            {sql_to_time}
            {sql_id_obj}
        GROUP BY agg.ids,
                agg.name,
                agg.geom
        """.format(agg_cols_prefix=agg_cols_prefix,
                   development_select_cols=self.__agg_cols(region_agg=False),
                   region_table=region_table,
                   development_json_build_obj=self.__build_obj(want_age_groups=want_age_groups),
                   dataTable=self.data_table,
                   sql_from_time=sql_from_time, sql_to_time=sql_to_time, sql_id_obj=sql_id_obj))

        # current_app.logger.debug(f'Counties: {sql_stmt}')

        return db.engine.execute(sql_stmt,
                                 fromTimeParam=from_time,
                                 toTimeParam=to_time,
                                 idParam=id_obj
                                 )

    def __get_counties(self, from_time, to_time, id_county, want_age_groups: bool):
        """
            Return the development of covid cases and deaths
            by counties
        """

        sql_from_time = ""
        sql_to_time = ""
        sql_id_county = ""

        if from_time:
            sql_from_time = f"AND agg.timestamp >= :fromTimeParam"

        if to_time:
            sql_to_time = f"AND agg.timestamp <= :toTimeParam"

        if id_county:
            sql_id_county = f"AND agg.county_id = :idParam"

        # noinspection SqlConstantCondition,SqlUnused,SqlResolve
        sql_stmt = text("""
            WITH filtered_and_agg AS (
                SELECT 
                    county_id,
                    -- check if the first value is null, can ONLY happen if there are no values for the landkreis, 
                    -- then we return null
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
                FROM {dataTable} AS agg
                WHERE 1 = 1
                {sql_from_time}
                {sql_to_time}
                {sql_id_county}
                GROUP BY county_id
            
            )
            SELECT 
                le.ids AS ids,
                le.name AS name,
                le.bez AS description,
                st_asgeojson(le.geom)::jsonb AS geom,
                st_asgeojson(st_centroid(le.geom))::jsonb AS centroid,
                agg.development,
                agg.developmentDays
            FROM filtered_and_agg AS agg
            JOIN landkreise_extended AS le ON agg.county_id = le.ids
        """.format(buildObj=self.__build_obj(county_level=True, want_age_groups=want_age_groups),
                   dataTable=self.data_table, sql_from_time=sql_from_time,
                   sql_to_time=sql_to_time,
                   sql_id_county=sql_id_county))

        # current_app.logger.debug(f'Counties: {sql_stmt}')

        return db.engine.execute(sql_stmt,
                                 fromTimeParam=from_time,
                                 toTimeParam=to_time,
                                 idParam=id_county
                                 )

    def __agg_region_query(self, agg_table_dict, from_time, to_time, want_age_groups):

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
            SELECT {development_select_cols}
            FROM {data_table} c
            WHERE {region_filters}
            GROUP BY c.timestamp
        ), 
        agg AS (
            SELECT *
            FROM filtered c
            CROSS JOIN regions_arr
        )
        SELECT agg.ids,
            agg.name,
            agg.desc,
            st_asgeojson(agg.geom) :: jsonb             AS geom,
            st_asgeojson(st_centroid(agg.geom)):: jsonb AS centroid,
            -- check if the first value is null, can ONLY happen if there are no values for the landkreis, 
            -- then we return null
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
            {sql_from_time}
            {sql_to_time}
        GROUP BY agg.ids,
                agg.name,
                agg.geom,
                agg.desc
        """.format(agg_table=agg_table, development_select_cols=self.__agg_cols(region_agg=True),
                   development_json_build_obj=self.__build_obj(want_age_groups=want_age_groups),
                   data_table=self.data_table,
                   sql_from_time=sql_from_time, sql_to_time=sql_to_time, sql_id_obj=sql_id_obj, sql_joins=sql_joins,
                   number_of_ids=number_of_ids, region_filters=region_filters))

        # current_app.logger.debug(f'Agg Regions: {sql_stmt}')

        # return sql_stmt
        return db.engine.execute(sql_stmt,
                                 fromTimeParam=from_time,
                                 toTimeParam=to_time
                                 )
