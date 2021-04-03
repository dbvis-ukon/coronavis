"""create germany materialized view

Revision ID: 00a7bf4dae6c
Revises: 8175af65a5b9
Create Date: 2020-11-26 14:37:50.902921

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '00a7bf4dae6c'
down_revision = '8175af65a5b9'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    create materialized view germany as
SELECT 'Germany'::text              AS name,
       'de'::text                   AS ids,
       st_union(bundeslaender.geom) AS geom
FROM bundeslaender;
    """)


def downgrade():
    op.get_bind().execute("""
    drop materialized view germany;
    """)
