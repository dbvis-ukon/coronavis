"""create cases_per_county_and_day_risklayer materialized view

Revision ID: 30bea01e7bac
Revises: a9ca657b90f5
Create Date: 2020-11-26 15:27:18.363834

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '30bea01e7bac'
down_revision = 'a9ca657b90f5'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    create materialized view cases_per_county_and_day_risklayer as
WITH risklayer_daily AS (
    SELECT c.datenbestand AS "timestamp",
           c.updated_at   AS last_updated,
           c.created_at   AS inserted,
           c.ags          AS ids,
           c.cases,
           c.deaths
    FROM cases_lk_risklayer c
    ORDER BY c.date, c.ags
),
     risklayer_daily_with_7 AS (
         SELECT r_1."timestamp",
                r_1.last_updated,
                r_1.inserted,
                r_1.ids,
                r_1.cases,
                r_1.deaths,
                r2.cases  AS cases_7_days_ago,
                r2.deaths AS deaths_7_days_ago
         FROM risklayer_daily r_1
                  LEFT JOIN risklayer_daily r2 ON r_1.ids::text = r2.ids::text AND r2."timestamp"::date =
                                                                                   (COALESCE(r_1."timestamp",
                                                                                             (SELECT max(r3.last_updated) AS max
                                                                                              FROM risklayer_daily r3
                                                                                              WHERE r3.ids::text = r_1.ids::text)) -
                                                                                    '7 days'::interval)::date
     ),
     lk_with_population AS (
         SELECT le.name,
                le.bez,
                le.ids,
                le.geom,
                p.population
         FROM landkreise_extended le
                  JOIN (SELECT bevoelkerung.kreisschluessel,
                               sum(bevoelkerung.anzahl) AS population
                        FROM bevoelkerung
                        GROUP BY bevoelkerung.kreisschluessel) p ON p.kreisschluessel = le.ids::integer
     ),
     bed_capacitis AS (
         SELECT bce.landkreise_extended_ids,
                bc.datenbestand,
                bc.bl,
                bc.bl_id,
                bc.county,
                bc.anzahl_standorte,
                bc.anzahl_meldebereiche,
                bc.betten_frei,
                bc.betten_belegt,
                bc.betten_gesamt,
                bc.anteil_betten_frei,
                bc.faelle_covid_aktuell,
                bc.faelle_covid_aktuell_beatmet,
                bc.anteil_covid_beatmet,
                bc.anteil_covid_betten,
                bc.id
         FROM bed_capacity2landkreise_extended bce
                  JOIN bed_capacity bc ON bce.bed_capacity_name::text = bc.county::text
     )
SELECT r."timestamp"::timestamp(0) with time zone                                               AS "timestamp",
       r.last_updated::timestamp(0) with time zone                                              AS last_updated,
       r.inserted::timestamp(0) with time zone                                                  AS inserted,
       lk.ids,
       lk.name,
       lk.bez                                                                                   AS "desc",
       lk.geom,
       r.cases,
       r.deaths,
       lk.population,
       (r.deaths / r.cases)::double precision * 100.0::double precision                         AS death_rate,
       r.cases::double precision / lk.population::double precision * 100000.0::double precision AS cases_per_100k,
       r.cases::double precision / lk.population::double precision * 100.0::double precision    AS cases_per_population,
       (r.cases - r.cases_7_days_ago)::double precision / lk.population::double precision *
       100000.0::double precision                                                               AS cases7_per_100k,
       r.cases_7_days_ago                                                                       AS cases7_days_ago,
       b.betten_gesamt                                                                          AS beds_total,
       b.betten_belegt                                                                          AS beds_occupied,
       b.betten_frei                                                                            AS beds_free,
       b.faelle_covid_aktuell                                                                   AS cases_covid,
       b.faelle_covid_aktuell_beatmet                                                           AS cases_covid_ventilated,
       b.anzahl_standorte                                                                       AS num_locations,
       b.anzahl_meldebereiche                                                                   AS num_reporting_areas,
       b.anteil_betten_frei                                                                     AS proportion_beds_free,
       b.anteil_covid_betten                                                                    AS proportion_covid_beds,
       b.anteil_covid_beatmet                                                                   AS proportion_covid_ventilated
FROM risklayer_daily_with_7 r
         LEFT JOIN bed_capacitis b
                   ON r.ids::text = b.landkreise_extended_ids::text AND r."timestamp"::date = b.datenbestand::date
         LEFT JOIN lk_with_population lk ON r.ids::text = lk.ids::text
ORDER BY r."timestamp" DESC, lk.name;
    """)


def downgrade():
    op.get_bind().execute("""
    drop materialized view cases_per_county_and_day_risklayer;
    """)
