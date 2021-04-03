"""create cases_per_county_and_day materialized view

Revision ID: a9ca657b90f5
Revises: f8791d49d830
Create Date: 2020-11-26 15:25:59.925681

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'a9ca657b90f5'
down_revision = 'f8791d49d830'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    create materialized view cases_per_county_and_day as
WITH fixed_idlandkres AS (
    SELECT t.datenbestand,
           t.idbundesland,
           t.bundesland,
           t.objectid,
           t.meldedatum,
           t.gender,
           t.agegroup,
           t.casetype,
           t.id,
           CASE
               WHEN t.idlandkreis::text ~~ '11___'::text THEN '11000'::character varying
               ELSE t.idlandkreis
               END AS idlandkreis,
           CASE
               WHEN t.casetype::text = 'case'::text THEN 1
               ELSE 0
               END AS new_cases,
           CASE
               WHEN t.casetype::text = 'death'::text THEN 1
               ELSE 0
               END AS new_deaths,
           CASE
               WHEN t.casetype::text = 'case'::text AND t.agegroup::text = 'A00-A04'::text THEN 1
               ELSE 0
               END AS "c_A00-A04",
           CASE
               WHEN t.casetype::text = 'case'::text AND t.agegroup::text = 'A05-A14'::text THEN 1
               ELSE 0
               END AS "c_A05-A14",
           CASE
               WHEN t.casetype::text = 'case'::text AND t.agegroup::text = 'A15-A34'::text THEN 1
               ELSE 0
               END AS "c_A15-A34",
           CASE
               WHEN t.casetype::text = 'case'::text AND t.agegroup::text = 'A35-A59'::text THEN 1
               ELSE 0
               END AS "c_A35-A59",
           CASE
               WHEN t.casetype::text = 'case'::text AND t.agegroup::text = 'A60-A79'::text THEN 1
               ELSE 0
               END AS "c_A60-A79",
           CASE
               WHEN t.casetype::text = 'case'::text AND t.agegroup::text = 'A80+'::text THEN 1
               ELSE 0
               END AS "c_A80+",
           CASE
               WHEN t.casetype::text = 'case'::text AND t.agegroup::text = 'unbekannt'::text THEN 1
               ELSE 0
               END AS "c_Aunbekannt",
           CASE
               WHEN t.casetype::text = 'death'::text AND t.agegroup::text = 'A00-A04'::text THEN 1
               ELSE 0
               END AS "d_A00-A04",
           CASE
               WHEN t.casetype::text = 'death'::text AND t.agegroup::text = 'A05-A14'::text THEN 1
               ELSE 0
               END AS "d_A05-A14",
           CASE
               WHEN t.casetype::text = 'death'::text AND t.agegroup::text = 'A15-A34'::text THEN 1
               ELSE 0
               END AS "d_A15-A34",
           CASE
               WHEN t.casetype::text = 'death'::text AND t.agegroup::text = 'A35-A59'::text THEN 1
               ELSE 0
               END AS "d_A35-A59",
           CASE
               WHEN t.casetype::text = 'death'::text AND t.agegroup::text = 'A60-A79'::text THEN 1
               ELSE 0
               END AS "d_A60-A79",
           CASE
               WHEN t.casetype::text = 'death'::text AND t.agegroup::text = 'A80+'::text THEN 1
               ELSE 0
               END AS "d_A80+",
           CASE
               WHEN t.casetype::text = 'death'::text AND t.agegroup::text = 'unbekannt'::text THEN 1
               ELSE 0
               END AS "d_Aunbekannt"
    FROM cases_current t
),
     first_meldedatum_per_lk AS (
         SELECT fixed_idlandkres.idlandkreis,
                min(fixed_idlandkres.meldedatum) AS first_meldetatum
         FROM fixed_idlandkres
         GROUP BY fixed_idlandkres.idlandkreis
     ),
     filled_ts AS (
         SELECT a_1.idlandkreis,
                b."timestamp"::date AS meldedatum
         FROM first_meldedatum_per_lk a_1
                  JOIN LATERAL ( SELECT generate_series(a_1.first_meldetatum::date::timestamp with time zone,
                                                        (now() - '1 day'::interval)::date::timestamp with time zone,
                                                        '1 day'::interval) AS "timestamp") b ON true
     ),
     new_data_per_day AS (
         SELECT b.idlandkreis,
                b.meldedatum,
                sum(a_1.new_cases)      AS new_cases,
                sum(a_1.new_deaths)     AS new_deaths,
                sum(a_1."c_A00-A04")    AS "c_A00-A04",
                sum(a_1."c_A05-A14")    AS "c_A05-A14",
                sum(a_1."c_A15-A34")    AS "c_A15-A34",
                sum(a_1."c_A35-A59")    AS "c_A35-A59",
                sum(a_1."c_A60-A79")    AS "c_A60-A79",
                sum(a_1."c_A80+")       AS "c_A80+",
                sum(a_1."c_Aunbekannt") AS "c_Aunbekannt",
                sum(a_1."d_A00-A04")    AS "d_A00-A04",
                sum(a_1."d_A05-A14")    AS "d_A05-A14",
                sum(a_1."d_A15-A34")    AS "d_A15-A34",
                sum(a_1."d_A35-A59")    AS "d_A35-A59",
                sum(a_1."d_A60-A79")    AS "d_A60-A79",
                sum(a_1."d_A80+")       AS "d_A80+",
                sum(a_1."d_Aunbekannt") AS "d_Aunbekannt"
         FROM fixed_idlandkres a_1
                  RIGHT JOIN filled_ts b
                             ON a_1.meldedatum::date = b.meldedatum AND a_1.idlandkreis::text = b.idlandkreis::text
         GROUP BY b.idlandkreis, b.meldedatum
         ORDER BY b.idlandkreis, b.meldedatum
     ),
     combined_stats AS (
         SELECT n.meldedatum::timestamp without time zone + '1 day'::interval                                            AS "timestamp",
                n.idlandkreis                                                                                            AS ids,
                le.name,
                le.bez                                                                                                   AS "desc",
                le.geom,
                sum(n.new_cases)
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cases,
                sum(n.new_deaths)
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS deaths,
                sum(n."c_A00-A04")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "c_A00-A04",
                sum(n."c_A05-A14")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "c_A05-A14",
                sum(n."c_A15-A34")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "c_A15-A34",
                sum(n."c_A35-A59")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "c_A35-A59",
                sum(n."c_A60-A79")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "c_A60-A79",
                sum(n."c_A80+")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "c_A80+",
                sum(n."c_Aunbekannt")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "c_Aunbekannt",
                sum(n."d_A00-A04")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "d_A00-A04",
                sum(n."d_A05-A14")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "d_A05-A14",
                sum(n."d_A15-A34")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "d_A15-A34",
                sum(n."d_A35-A59")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "d_A35-A59",
                sum(n."d_A60-A79")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "d_A60-A79",
                sum(n."d_A80+")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "d_A80+",
                sum(n."d_Aunbekannt")
                OVER (PARTITION BY n.idlandkreis ORDER BY n.meldedatum ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS "d_Aunbekannt",
                p.population,
                pa."A00-A04"                                                                                             AS "p_A00-A04",
                pa."A05-A14"                                                                                             AS "p_A05-A14",
                pa."A15-A34"                                                                                             AS "p_A15-A34",
                pa."A35-A59"                                                                                             AS "p_A35-A59",
                pa."A60-A79"                                                                                             AS "p_A60-A79",
                pa."A80+"                                                                                                AS "p_A80+",
                pa.name                                                                                                  AS p_name
         FROM new_data_per_day n
                  JOIN (SELECT bevoelkerung.kreisschluessel,
                               sum(bevoelkerung.anzahl) AS population
                        FROM bevoelkerung
                        GROUP BY bevoelkerung.kreisschluessel) p ON p.kreisschluessel = n.idlandkreis::integer
                  JOIN landkreise_extended le ON n.idlandkreis::text = le.ids::text
                  LEFT JOIN population_rki_agegroup pa ON n.idlandkreis::text = pa.ags::text
         ORDER BY n.idlandkreis, n.meldedatum
     ),
     b AS (
         SELECT bb.ids::text                               AS ids,
                bb."timestamp",
                bb.cases / bb.population * 100000::numeric AS cases_7days_ago_per_100k,
                bb.cases                                   AS cases7_days_ago
         FROM combined_stats bb
     ),
     cc AS (
         SELECT comc."timestamp",
                comc.ids,
                comc.name,
                comc."desc",
                comc.geom,
                comc.cases,
                comc.deaths,
                comc."c_A00-A04",
                comc."c_A05-A14",
                comc."c_A15-A34",
                comc."c_A35-A59",
                comc."c_A60-A79",
                comc."c_A80+",
                comc."c_Aunbekannt",
                comc."d_A00-A04",
                comc."d_A05-A14",
                comc."d_A15-A34",
                comc."d_A35-A59",
                comc."d_A60-A79",
                comc."d_A80+",
                comc."d_Aunbekannt",
                comc.population,
                comc."p_A00-A04",
                comc."p_A05-A14",
                comc."p_A15-A34",
                comc."p_A35-A59",
                comc."p_A60-A79",
                comc."p_A80+",
                comc.p_name,
                b.cases_7days_ago_per_100k,
                b.cases7_days_ago
         FROM combined_stats comc
                  JOIN b ON comc.ids::text = b.ids AND (comc."timestamp" - '7 days'::interval) = b."timestamp"
     )
SELECT DISTINCT a."timestamp",
                a."timestamp"                                                         AS last_updated,
                a."timestamp"                                                         AS inserted,
                a.ids,
                a.name,
                a."desc",
                a.geom,
                a.cases,
                a.deaths,
                a.population,
                a.deaths / a.cases * 100::numeric                                     AS death_rate,
                a.cases / a.population * 100000::numeric                              AS cases_per_100k,
                a.cases / a.population * 100::numeric                                 AS cases_per_population,
                a.cases / a.population * 100000::numeric - a.cases_7days_ago_per_100k AS cases7_per_100k,
                a.cases7_days_ago,
                a."c_A00-A04",
                a."c_A05-A14",
                a."c_A15-A34",
                a."c_A35-A59",
                a."c_A60-A79",
                a."c_A80+",
                a."c_Aunbekannt",
                a."d_A00-A04",
                a."d_A05-A14",
                a."d_A15-A34",
                a."d_A35-A59",
                a."d_A60-A79",
                a."d_A80+",
                a."d_Aunbekannt",
                a."p_A00-A04",
                a."p_A05-A14",
                a."p_A15-A34",
                a."p_A35-A59",
                a."p_A60-A79",
                a."p_A80+",
                bc.betten_gesamt                                                      AS beds_total,
                bc.betten_belegt                                                      AS beds_occupied,
                bc.betten_frei                                                        AS beds_free,
                bc.faelle_covid_aktuell                                               AS cases_covid,
                bc.faelle_covid_aktuell_beatmet                                       AS cases_covid_ventilated,
                bc.anzahl_standorte                                                   AS num_locations,
                bc.anzahl_meldebereiche                                               AS num_reporting_areas,
                bc.anteil_betten_frei                                                 AS proportion_beds_free,
                bc.anteil_covid_betten                                                AS proportion_covid_beds,
                bc.anteil_covid_beatmet                                               AS proportion_covid_ventilated
FROM cc a
         LEFT JOIN bed_capacity2landkreise_extended bc2le ON a.ids::text = bc2le.landkreise_extended_ids::text
         LEFT JOIN bed_capacity bc
                   ON bc2le.bed_capacity_name::text = bc.county::text AND bc.datenbestand::date = a."timestamp"::date
ORDER BY a."timestamp", a.name;
    """)


def downgrade():
    op.get_bind().execute("""
    drop materialized view cases_per_county_and_day;
    """)
