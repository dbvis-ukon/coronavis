"""create bundeslaender materialized view

Revision ID: 8175af65a5b9
Revises: 7066fb8c8990
Create Date: 2020-11-26 14:30:45.279091

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '8175af65a5b9'
down_revision = '7066fb8c8990'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    create materialized view bundeslaender as
SELECT vk.gen                                                                      AS name,
       vk.ags                                                                      AS ids,
       st_makevalid(st_simplifypreservetopology(vk.geom, 0.005::double precision)) AS geom
FROM vg250_lan vk
WHERE vk.gf = 4;
    """)


def downgrade():
    op.get_bind().execute("""
    drop materialized view bundeslaender;
    """)
