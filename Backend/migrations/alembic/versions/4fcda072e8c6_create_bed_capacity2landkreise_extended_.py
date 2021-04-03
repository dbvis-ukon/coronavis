"""create bed_capacity2landkreise_extended table

Revision ID: 4fcda072e8c6
Revises: f8791d49d830
Create Date: 2020-11-26 15:23:00.162009

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '4fcda072e8c6'
down_revision = 'b84312f6532e'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    -- auto-generated definition
create table bed_capacity2landkreise_extended
(
    bed_capacity_name       varchar not null
        constraint bed_capacity2landkreise_extended_pk
            primary key,
    landkreise_extended_ids varchar
);

create unique index bed_capacity2landkreise_extended_bed_capacity_name_landkreise_e
    on bed_capacity2landkreise_extended (bed_capacity_name, landkreise_extended_ids);
    """)


def downgrade():
    op.drop_table('bed_capacity2landkreise_extended')
