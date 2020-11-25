"""create cases table

Revision ID: 3610493d8979
Revises: 
Create Date: 2020-11-25 20:42:26.698495

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3610493d8979'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    create table cases
(
    datenbestand timestamp with time zone,
    idbundesland integer,
    bundesland   varchar(255),
    landkreis    varchar(255),
    objectid     integer,
    meldedatum   timestamp with time zone,
    gender       varchar(255),
    agegroup     varchar(255),
    casetype     varchar(255),
    id           serial not null
        constraint cases_pkey
            primary key,
    idlandkreis  varchar
);

create index cases_meldedatum_idlandkreis_index
    on cases (meldedatum, idlandkreis);

create index cases_datenbestand_index
    on cases (datenbestand desc);
    """)


def downgrade():
    op.drop_table('cases')
