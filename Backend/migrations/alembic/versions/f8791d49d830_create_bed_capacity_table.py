"""create bed_capacity table

Revision ID: f8791d49d830
Revises: b84312f6532e
Create Date: 2020-11-26 15:22:19.299937

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f8791d49d830'
down_revision = '4fcda072e8c6'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    -- auto-generated definition
create table bed_capacity
(
    datenbestand                 timestamp with time zone,
    bl                           varchar,
    bl_id                        varchar(255),
    county                       varchar
        constraint bed_capacity_bed_capacity2landkreise_extended_bed_capacity_name
            references bed_capacity2landkreise_extended,
    anzahl_standorte             integer,
    anzahl_meldebereiche         integer,
    betten_frei                  integer,
    betten_belegt                integer,
    betten_gesamt                integer,
    anteil_betten_frei           double precision,
    faelle_covid_aktuell         integer,
    faelle_covid_aktuell_beatmet integer,
    anteil_covid_beatmet         integer,
    anteil_covid_betten          double precision,
    id                           serial not null
        constraint bed_capacity_pkey
            primary key
);

create index bed_capacity_datenbestand_index
    on bed_capacity (datenbestand desc);
    """)


def downgrade():
    op.drop_table('bed_capacity')
