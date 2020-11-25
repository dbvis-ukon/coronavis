"""create divi_krankenhaus_standorte table

Revision ID: 56a467c77bd8
Revises: 757ac6b4af83
Create Date: 2020-11-25 21:18:22.072429

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '56a467c77bd8'
down_revision = '757ac6b4af83'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    -- auto-generated definition
create table divi_krankenhaus_standorte
(
    id                             integer not null
        constraint divi_krankenhaus_standorte_pk
            primary key,
    bezeichnung                    text,
    strasse                        text,
    hausnummer                     text,
    plz                            text,
    ort                            text,
    bundesland                     text,
    iknummer                       text,
    position                       geometry(Point, 4326),
    intensivmedizinischeplanbetten text,
    meldebereichenichtvollstaendig boolean,
    gemeindeschluessel             text
);

create unique index divi_krankenhaus_standort_id_uindex
    on divi_krankenhaus_standorte (id);
    """)


def downgrade():
    op.drop_table('divi_krankenhaus_standorte')
