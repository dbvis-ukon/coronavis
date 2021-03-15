"""update materialized view cases_per_county_and_day

Revision ID: f96132b7a0d1
Revises: 91c9d723d958
Create Date: 2021-03-14 16:25:36.237889

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f96132b7a0d1'
down_revision = '91c9d723d958'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    drop materialized view cases_per_county_and_day;
    
create materialized view cases_per_county_and_day as
WITH fixed_idlandkreis AS (
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
         SELECT fixed_idlandkreis.idlandkreis,
                min(fixed_idlandkreis.meldedatum) AS first_meldetatum
         FROM fixed_idlandkreis
         GROUP BY fixed_idlandkreis.idlandkreis
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
         FROM fixed_idlandkreis a_1
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
                bc.anteil_covid_beatmet                                               AS proportion_covid_ventilated,
                surv.a00 AS "c2_A00",
                surv.a01 AS "c2_A01",
                surv.a02 AS "c2_A02",
                surv.a03 AS "c2_A03",
                surv.a04 AS "c2_A04",
                surv.a05 AS "c2_A05",
                surv.a06 AS "c2_A06",
                surv.a07 AS "c2_A07",
                surv.a08 AS "c2_A08",
                surv.a09 AS "c2_A09",
                surv.a10 AS "c2_A10",
                surv.a11 AS "c2_A11",
                surv.a12 AS "c2_A12",
                surv.a13 AS "c2_A13",
                surv.a14 AS "c2_A14",
                surv.a15 AS "c2_A15",
                surv.a16 AS "c2_A16",
                surv.a17 AS "c2_A17",
                surv.a18 AS "c2_A18",
                surv.a19 AS "c2_A19",
                surv.a20 AS "c2_A20",
                surv.a21 AS "c2_A21",
                surv.a22 AS "c2_A22",
                surv.a23 AS "c2_A23",
                surv.a24 AS "c2_A24",
                surv.a25 AS "c2_A25",
                surv.a26 AS "c2_A26",
                surv.a27 AS "c2_A27",
                surv.a28 AS "c2_A28",
                surv.a29 AS "c2_A29",
                surv.a30 AS "c2_A30",
                surv.a31 AS "c2_A31",
                surv.a32 AS "c2_A32",
                surv.a33 AS "c2_A33",
                surv.a34 AS "c2_A34",
                surv.a35 AS "c2_A35",
                surv.a36 AS "c2_A36",
                surv.a37 AS "c2_A37",
                surv.a38 AS "c2_A38",
                surv.a39 AS "c2_A39",
                surv.a40 AS "c2_A40",
                surv.a41 AS "c2_A41",
                surv.a42 AS "c2_A42",
                surv.a43 AS "c2_A43",
                surv.a44 AS "c2_A44",
                surv.a45 AS "c2_A45",
                surv.a46 AS "c2_A46",
                surv.a47 AS "c2_A47",
                surv.a48 AS "c2_A48",
                surv.a49 AS "c2_A49",
                surv.a50 AS "c2_A50",
                surv.a51 AS "c2_A51",
                surv.a52 AS "c2_A52",
                surv.a53 AS "c2_A53",
                surv.a54 AS "c2_A54",
                surv.a55 AS "c2_A55",
                surv.a56 AS "c2_A56",
                surv.a57 AS "c2_A57",
                surv.a58 AS "c2_A58",
                surv.a59 AS "c2_A59",
                surv.a60 AS "c2_A60",
                surv.a61 AS "c2_A61",
                surv.a62 AS "c2_A62",
                surv.a63 AS "c2_A63",
                surv.a64 AS "c2_A64",
                surv.a65 AS "c2_A65",
                surv.a66 AS "c2_A66",
                surv.a67 AS "c2_A67",
                surv.a68 AS "c2_A68",
                surv.a69 AS "c2_A69",
                surv.a70 AS "c2_A70",
                surv.a71 AS "c2_A71",
                surv.a72 AS "c2_A72",
                surv.a73 AS "c2_A73",
                surv.a74 AS "c2_A74",
                surv.a75 AS "c2_A75",
                surv.a76 AS "c2_A76",
                surv.a77 AS "c2_A77",
                surv.a78 AS "c2_A78",
                surv.a79 AS "c2_A79",
                surv."A80+" AS "c2_A80+",
                surv.unbekannt AS "c2_AUnbekannt",
                pop_surv.a00 AS "p2_A00",
                pop_surv.a01 AS "p2_A01",
                pop_surv.a02 AS "p2_A02",
                pop_surv.a03 AS "p2_A03",
                pop_surv.a04 AS "p2_A04",
                pop_surv.a05 AS "p2_A05",
                pop_surv.a06 AS "p2_A06",
                pop_surv.a07 AS "p2_A07",
                pop_surv.a08 AS "p2_A08",
                pop_surv.a09 AS "p2_A09",
                pop_surv.a10 AS "p2_A10",
                pop_surv.a11 AS "p2_A11",
                pop_surv.a12 AS "p2_A12",
                pop_surv.a13 AS "p2_A13",
                pop_surv.a14 AS "p2_A14",
                pop_surv.a15 AS "p2_A15",
                pop_surv.a16 AS "p2_A16",
                pop_surv.a17 AS "p2_A17",
                pop_surv.a18 AS "p2_A18",
                pop_surv.a19 AS "p2_A19",
                pop_surv.a20 AS "p2_A20",
                pop_surv.a21 AS "p2_A21",
                pop_surv.a22 AS "p2_A22",
                pop_surv.a23 AS "p2_A23",
                pop_surv.a24 AS "p2_A24",
                pop_surv.a25 AS "p2_A25",
                pop_surv.a26 AS "p2_A26",
                pop_surv.a27 AS "p2_A27",
                pop_surv.a28 AS "p2_A28",
                pop_surv.a29 AS "p2_A29",
                pop_surv.a30 AS "p2_A30",
                pop_surv.a31 AS "p2_A31",
                pop_surv.a32 AS "p2_A32",
                pop_surv.a33 AS "p2_A33",
                pop_surv.a34 AS "p2_A34",
                pop_surv.a35 AS "p2_A35",
                pop_surv.a36 AS "p2_A36",
                pop_surv.a37 AS "p2_A37",
                pop_surv.a38 AS "p2_A38",
                pop_surv.a39 AS "p2_A39",
                pop_surv.a40 AS "p2_A40",
                pop_surv.a41 AS "p2_A41",
                pop_surv.a42 AS "p2_A42",
                pop_surv.a43 AS "p2_A43",
                pop_surv.a44 AS "p2_A44",
                pop_surv.a45 AS "p2_A45",
                pop_surv.a46 AS "p2_A46",
                pop_surv.a47 AS "p2_A47",
                pop_surv.a48 AS "p2_A48",
                pop_surv.a49 AS "p2_A49",
                pop_surv.a50 AS "p2_A50",
                pop_surv.a51 AS "p2_A51",
                pop_surv.a52 AS "p2_A52",
                pop_surv.a53 AS "p2_A53",
                pop_surv.a54 AS "p2_A54",
                pop_surv.a55 AS "p2_A55",
                pop_surv.a56 AS "p2_A56",
                pop_surv.a57 AS "p2_A57",
                pop_surv.a58 AS "p2_A58",
                pop_surv.a59 AS "p2_A59",
                pop_surv.a60 AS "p2_A60",
                pop_surv.a61 AS "p2_A61",
                pop_surv.a62 AS "p2_A62",
                pop_surv.a63 AS "p2_A63",
                pop_surv.a64 AS "p2_A64",
                pop_surv.a65 AS "p2_A65",
                pop_surv.a66 AS "p2_A66",
                pop_surv.a67 AS "p2_A67",
                pop_surv.a68 AS "p2_A68",
                pop_surv.a69 AS "p2_A69",
                pop_surv.a70 AS "p2_A70",
                pop_surv.a71 AS "p2_A71",
                pop_surv.a72 AS "p2_A72",
                pop_surv.a73 AS "p2_A73",
                pop_surv.a74 AS "p2_A74",
                pop_surv.a75 AS "p2_A75",
                pop_surv.a76 AS "p2_A76",
                pop_surv.a77 AS "p2_A77",
                pop_surv.a78 AS "p2_A78",
                pop_surv.a79 AS "p2_A79",
                pop_surv."A80+" AS "p2_A80+"
FROM cc a
         LEFT JOIN bed_capacity2landkreise_extended bc2le ON a.ids::text = bc2le.landkreise_extended_ids::text
         LEFT JOIN bed_capacity bc
                   ON bc2le.bed_capacity_name::text = bc.county::text AND bc.datenbestand::date = a."timestamp"::date
         LEFT OUTER JOIN survstat_cases_agegroup surv ON surv.ags::text = a.ids
                                                                AND extract(isoyear from a.timestamp) = surv.year
                                                                AND extract(week from a.timestamp) = surv.week
         LEFT OUTER JOIN population_survstat_agegroup pop_surv ON a.ids = pop_surv.ags::text
ORDER BY a."timestamp", a.name;
    """)


def downgrade():
    op.get_bind().execute("""
        drop materialized view cases_per_county_and_day;
    """)
