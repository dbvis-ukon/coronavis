"""fix filled_hospital_timeseries_with_fix materialized view

Revision ID: d5d392162842
Revises: 305475aa6432
Create Date: 2020-11-29 12:11:05.747417

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5d392162842'
down_revision = '305475aa6432'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    drop materialized view filled_hospital_timeseries_with_fix;
    
    create materialized view filled_hospital_timeseries_with_fix as
WITH first_update_per_hospital AS (
    SELECT m.kh_id,
           min(m.meldezeitpunkt) AS first_meldezeitpunkt
    FROM divi_meldungen m
    WHERE m.private = false
      AND m.meldezeitpunkt >= '2020-03-19 00:00:00'::timestamp without time zone
    GROUP BY m.kh_id
),
     hospital_time_series AS (
         SELECT first_update_per_hospital.kh_id,
                b."timestamp"
         FROM first_update_per_hospital
                  JOIN LATERAL ( SELECT generate_series(
                                                first_update_per_hospital.first_meldezeitpunkt::date::timestamp without time zone,
                                                now()::date::timestamp without time zone,
                                                '1 day'::interval) AS "timestamp") b ON true
     ),
     latest_hospital_update_per_day AS (
         SELECT DISTINCT ON (m.kh_id, (m.meldezeitpunkt::date)) m.kh_id,
                                                                m.meldezeitpunkt::date        AS day,
                                                                m.meldezeitpunkt,
                                                                m.created_at,
                                                                m.updated_at,
                                                                m.statuseinschaetzunglowcare  AS icu_low_state,
                                                                m.statuseinschaetzunghighcare AS icu_high_state,
                                                                m.statuseinschaetzungecmo     AS ecmo_state
         FROM divi_meldungen m
         WHERE m.private = false
         ORDER BY m.kh_id, (m.meldezeitpunkt::date), m.meldezeitpunkt DESC
     ),
     filled_hospital_timeseries AS (
         SELECT t.kh_id,
                t."timestamp",
                last_value(t.meldezeitpunkt) OVER (PARTITION BY t.grp_close)            AS updated_at,
                first_value(t.meldezeitpunkt) OVER (PARTITION BY t.grp_close)           AS created_at,
                COALESCE(last_value(t.icu_low_state) OVER (PARTITION BY t.grp_close),
                         first_value(t.icu_low_state) OVER (PARTITION BY t.grp_close))  AS icu_low_state,
                COALESCE(last_value(t.icu_high_state) OVER (PARTITION BY t.grp_close),
                         first_value(t.icu_high_state) OVER (PARTITION BY t.grp_close)) AS icu_high_state,
                COALESCE(last_value(t.ecmo_state) OVER (PARTITION BY t.grp_close),
                         first_value(t.ecmo_state) OVER (PARTITION BY t.grp_close))     AS ecmo_state
         FROM (SELECT hospital_time_series.kh_id,
                      hospital_time_series."timestamp",
                      latest_hospital_update_per_day.meldezeitpunkt,
                      latest_hospital_update_per_day.icu_low_state,
                      latest_hospital_update_per_day.icu_high_state,
                      latest_hospital_update_per_day.ecmo_state,
                      sum(
                      CASE
                          WHEN latest_hospital_update_per_day.meldezeitpunkt IS NOT NULL THEN 1
                          ELSE NULL::integer
                          END) OVER (ORDER BY hospital_time_series.kh_id, hospital_time_series."timestamp") AS grp_close
               FROM hospital_time_series
                        LEFT JOIN latest_hospital_update_per_day
                                  ON hospital_time_series.kh_id = latest_hospital_update_per_day.kh_id AND
                                     hospital_time_series."timestamp"::date =
                                     latest_hospital_update_per_day.meldezeitpunkt::date) t
     ),
     latest_hospital_info AS (
         SELECT hi.id,
                hi.bezeichnung,
                hi.strasse,
                hi.hausnummer,
                hi.plz,
                hi.ort,
                hi.bundesland,
                hi.iknummer,
                hi."position",
                hi.intensivmedizinischeplanbetten,
                hi.meldebereichenichtvollstaendig,
                hi.gemeindeschluessel,
                landkreise_extended.ids AS landkreis_id,
                regierungsbezirke.ids   AS regierungsbezirk_id,
                bundeslaender.ids       AS bundesland_id,
                CASE
                    WHEN st_distance(hi."position"::geography, b.geom::geography) < 500::double precision THEN true
                    ELSE false
                    END                 AS helipad_nearby
         FROM divi_krankenhaus_standorte hi
                  JOIN LATERAL ( SELECT helipads.osm_id,
                                        helipads.name,
                                        helipads.geom
                                 FROM helipads
                                 WHERE st_x(hi."position") > 0::double precision
                                   AND st_x(hi."position") < 999::double precision
                                   AND st_y(hi."position") > 0::double precision
                                   AND st_y(hi."position") < 999::double precision
                                 ORDER BY (hi."position" <-> helipads.geom)
                                 LIMIT 1) b ON true
                  LEFT JOIN landkreise_extended ON st_contains(landkreise_extended.geom, hi."position")
                  LEFT JOIN regierungsbezirke ON st_contains(regierungsbezirke.geom, hi."position")
                  LEFT JOIN bundeslaender ON st_contains(bundeslaender.geom, hi."position")
         WHERE st_x(hi."position") > 0::double precision
           AND st_x(hi."position") < 999::double precision
           AND st_y(hi."position") > 0::double precision
           AND st_y(hi."position") < 999::double precision
     )
SELECT f.kh_id                                                                                       AS hospital_id,
       l.bezeichnung                                                                                 AS name,
       (((((l.strasse || ' '::text) || l.hausnummer) || ', '::text) || l.plz) || ' '::text) || l.ort AS address,
       l.bundesland                                                                                  AS state,
       ''::text                                                                                      AS contact,
       l."position"                                                                                  AS geom,
       l.helipad_nearby,
       f."timestamp",
       COALESCE(f.updated_at, f.created_at)                                                          AS last_update,
       f.created_at                                                                                  AS inserted,
       f.created_at                                                                                  AS last_insert_date,
       f."timestamp"::timestamp with time zone - COALESCE(f.updated_at, f.created_at)                AS age,
       f.icu_low_state,
       f.icu_high_state,
       f.ecmo_state,
       CASE
           WHEN f.icu_low_state = 'VERFUEGBAR'::text THEN 1
           ELSE 0
           END                                                                                       AS icu_low_v,
       CASE
           WHEN f.icu_low_state = 'BEGRENZT'::text THEN 1
           ELSE 0
           END                                                                                       AS icu_low_b,
       CASE
           WHEN f.icu_low_state = 'NICHT_VERFUEGBAR'::text THEN 1
           ELSE 0
           END                                                                                       AS icu_low_a,
       CASE
           WHEN f.icu_low_state = 'Nicht verfügbar'::text THEN 1
           ELSE 0
           END                                                                                       AS icu_low_nv,
       CASE
           WHEN f.icu_high_state = 'VERFUEGBAR'::text THEN 1
           ELSE 0
           END                                                                                       AS icu_high_v,
       CASE
           WHEN f.icu_high_state = 'BEGRENZT'::text THEN 1
           ELSE 0
           END                                                                                       AS icu_high_b,
       CASE
           WHEN f.icu_high_state = 'NICHT_VERFUEGBAR'::text THEN 1
           ELSE 0
           END                                                                                       AS icu_high_a,
       CASE
           WHEN f.icu_high_state = 'KEINE_ANGABE'::text THEN 1
           ELSE 0
           END                                                                                       AS icu_high_nv,
       CASE
           WHEN f.ecmo_state = 'VERFUEGBAR'::text THEN 1
           ELSE 0
           END                                                                                       AS ecmo_low_v,
       CASE
           WHEN f.ecmo_state = 'BEGRENZT'::text THEN 1
           ELSE 0
           END                                                                                       AS ecmo_low_b,
       CASE
           WHEN f.ecmo_state = 'NICHT_VERFUEGBAR'::text THEN 1
           ELSE 0
           END                                                                                       AS ecmo_low_a,
       CASE
           WHEN f.ecmo_state = 'KEINE_ANGABE'::text THEN 1
           ELSE 0
           END                                                                                       AS ecmo_low_nv,
       CASE
           WHEN f.ecmo_state = 'VERFUEGBAR'::text THEN 1
           ELSE 0
           END                                                                                       AS ecmo_v,
       CASE
           WHEN f.ecmo_state = 'BEGRENZT'::text THEN 1
           ELSE 0
           END                                                                                       AS ecmo_b,
       CASE
           WHEN f.ecmo_state = 'NICHT_VERFUEGBAR'::text THEN 1
           ELSE 0
           END                                                                                       AS ecmo_a,
       CASE
           WHEN f.ecmo_state = 'KEINE_ANGABE'::text THEN 1
           ELSE 0
           END                                                                                       AS ecmo_nv,
       l.landkreis_id,
       l.regierungsbezirk_id,
       l.bundesland_id
FROM filled_hospital_timeseries f
         JOIN latest_hospital_info l ON f.kh_id = l.id;
    """)


def downgrade():
    op.get_bind().execute("""
    drop materialized view filled_hospital_timeseries_with_fix;
    
    create materialized view filled_hospital_timeseries_with_fix as
    WITH first_update_per_hospital AS (
        SELECT DISTINCT ON (m.kh_id) m.kh_id,
                                     m.meldezeitpunkt AS first_update
        FROM divi_meldungen m
        WHERE m.private = false
          AND m.meldezeitpunkt >= '2020-03-19 00:00:00'::timestamp without time zone
    ),
         hospital_time_series AS (
             SELECT first_update_per_hospital.kh_id,
                    b."timestamp"
             FROM first_update_per_hospital
                      JOIN LATERAL ( SELECT generate_series(
                                                    first_update_per_hospital.first_update::date::timestamp without time zone,
                                                    now()::date::timestamp without time zone,
                                                    '1 day'::interval) AS "timestamp") b ON true
         ),
         latest_hospital_update_per_day AS (
             SELECT DISTINCT ON (m.kh_id, (m.meldezeitpunkt::date)) m.kh_id,
                                                                    m.meldezeitpunkt::date        AS day,
                                                                    m.meldezeitpunkt              AS last_update,
                                                                    m.created_at,
                                                                    m.updated_at,
                                                                    m.statuseinschaetzunglowcare  AS icu_low_state,
                                                                    m.statuseinschaetzunghighcare AS icu_high_state,
                                                                    m.statuseinschaetzungecmo     AS ecmo_state
             FROM divi_meldungen m
             WHERE m.private = false
             ORDER BY m.kh_id, (m.meldezeitpunkt::date), m.meldezeitpunkt DESC
         ),
         filled_hospital_timeseries AS (
             SELECT t.kh_id,
                    t."timestamp",
                    first_value(t.updated_at) OVER (PARTITION BY t.grp_close)     AS updated_at,
                    first_value(t.created_at) OVER (PARTITION BY t.grp_close)     AS created_at,
                    first_value(t.icu_low_state) OVER (PARTITION BY t.grp_close)  AS icu_low_state,
                    first_value(t.icu_high_state) OVER (PARTITION BY t.grp_close) AS icu_high_state,
                    first_value(t.ecmo_state) OVER (PARTITION BY t.grp_close)     AS ecmo_state
             FROM (SELECT hospital_time_series.kh_id,
                          hospital_time_series."timestamp",
                          latest_hospital_update_per_day.created_at,
                          latest_hospital_update_per_day.updated_at,
                          latest_hospital_update_per_day.icu_low_state,
                          latest_hospital_update_per_day.icu_high_state,
                          latest_hospital_update_per_day.ecmo_state,
                          sum(
                          CASE
                              WHEN latest_hospital_update_per_day.last_update IS NOT NULL THEN 1
                              ELSE NULL::integer
                              END) OVER (ORDER BY hospital_time_series.kh_id, hospital_time_series."timestamp") AS grp_close
                   FROM hospital_time_series
                            LEFT JOIN latest_hospital_update_per_day
                                      ON hospital_time_series.kh_id = latest_hospital_update_per_day.kh_id AND
                                         hospital_time_series."timestamp"::date =
                                         latest_hospital_update_per_day.last_update::date) t
         ),
         latest_hospital_info AS (
             SELECT hi.id,
                    hi.bezeichnung,
                    hi.strasse,
                    hi.hausnummer,
                    hi.plz,
                    hi.ort,
                    hi.bundesland,
                    hi.iknummer,
                    hi."position",
                    hi.intensivmedizinischeplanbetten,
                    hi.meldebereichenichtvollstaendig,
                    hi.gemeindeschluessel,
                    landkreise_extended.ids AS landkreis_id,
                    regierungsbezirke.ids   AS regierungsbezirk_id,
                    bundeslaender.ids       AS bundesland_id,
                    CASE
                        WHEN st_distance(hi."position"::geography, b.geom::geography) < 500::double precision THEN true
                        ELSE false
                        END                 AS helipad_nearby
             FROM divi_krankenhaus_standorte hi
                      JOIN LATERAL ( SELECT helipads.osm_id,
                                            helipads.name,
                                            helipads.geom
                                     FROM helipads
                                     WHERE st_x(hi."position") > 0::double precision
                                       AND st_x(hi."position") < 999::double precision
                                       AND st_y(hi."position") > 0::double precision
                                       AND st_y(hi."position") < 999::double precision
                                     ORDER BY (hi."position" <-> helipads.geom)
                                     LIMIT 1) b ON true
                      LEFT JOIN landkreise_extended ON st_contains(landkreise_extended.geom, hi."position")
                      LEFT JOIN regierungsbezirke ON st_contains(regierungsbezirke.geom, hi."position")
                      LEFT JOIN bundeslaender ON st_contains(bundeslaender.geom, hi."position")
             WHERE st_x(hi."position") > 0::double precision
               AND st_x(hi."position") < 999::double precision
               AND st_y(hi."position") > 0::double precision
               AND st_y(hi."position") < 999::double precision
         )
    SELECT f.kh_id                                                                                       AS hospital_id,
           l.bezeichnung                                                                                 AS name,
           (((((l.strasse || ' '::text) || l.hausnummer) || ', '::text) || l.plz) || ' '::text) || l.ort AS address,
           l.bundesland                                                                                  AS state,
           ''::text                                                                                      AS contact,
           l."position"                                                                                  AS geom,
           l.helipad_nearby,
           f."timestamp",
           f.updated_at                                                                                  AS last_update,
           f.created_at                                                                                  AS inserted,
           f.created_at                                                                                  AS last_insert_date,
           f."timestamp"::timestamp with time zone - f.updated_at                                        AS age,
           f.icu_low_state,
           f.icu_high_state,
           f.ecmo_state,
           CASE
               WHEN f.icu_low_state = 'VERFUEGBAR'::text THEN 1
               ELSE 0
               END                                                                                       AS icu_low_v,
           CASE
               WHEN f.icu_low_state = 'BEGRENZT'::text THEN 1
               ELSE 0
               END                                                                                       AS icu_low_b,
           CASE
               WHEN f.icu_low_state = 'NICHT_VERFUEGBAR'::text THEN 1
               ELSE 0
               END                                                                                       AS icu_low_a,
           CASE
               WHEN f.icu_low_state = 'Nicht verfügbar'::text THEN 1
               ELSE 0
               END                                                                                       AS icu_low_nv,
           CASE
               WHEN f.icu_high_state = 'VERFUEGBAR'::text THEN 1
               ELSE 0
               END                                                                                       AS icu_high_v,
           CASE
               WHEN f.icu_high_state = 'BEGRENZT'::text THEN 1
               ELSE 0
               END                                                                                       AS icu_high_b,
           CASE
               WHEN f.icu_high_state = 'NICHT_VERFUEGBAR'::text THEN 1
               ELSE 0
               END                                                                                       AS icu_high_a,
           CASE
               WHEN f.icu_high_state = 'KEINE_ANGABE'::text THEN 1
               ELSE 0
               END                                                                                       AS icu_high_nv,
           CASE
               WHEN f.ecmo_state = 'VERFUEGBAR'::text THEN 1
               ELSE 0
               END                                                                                       AS ecmo_low_v,
           CASE
               WHEN f.ecmo_state = 'BEGRENZT'::text THEN 1
               ELSE 0
               END                                                                                       AS ecmo_low_b,
           CASE
               WHEN f.ecmo_state = 'NICHT_VERFUEGBAR'::text THEN 1
               ELSE 0
               END                                                                                       AS ecmo_low_a,
           CASE
               WHEN f.ecmo_state = 'KEINE_ANGABE'::text THEN 1
               ELSE 0
               END                                                                                       AS ecmo_low_nv,
           CASE
               WHEN f.ecmo_state = 'VERFUEGBAR'::text THEN 1
               ELSE 0
               END                                                                                       AS ecmo_v,
           CASE
               WHEN f.ecmo_state = 'BEGRENZT'::text THEN 1
               ELSE 0
               END                                                                                       AS ecmo_b,
           CASE
               WHEN f.ecmo_state = 'NICHT_VERFUEGBAR'::text THEN 1
               ELSE 0
               END                                                                                       AS ecmo_a,
           CASE
               WHEN f.ecmo_state = 'KEINE_ANGABE'::text THEN 1
               ELSE 0
               END                                                                                       AS ecmo_nv,
           l.landkreis_id,
           l.regierungsbezirk_id,
           l.bundesland_id
    FROM filled_hospital_timeseries f
             JOIN latest_hospital_info l ON f.kh_id = l.id;
        """)
