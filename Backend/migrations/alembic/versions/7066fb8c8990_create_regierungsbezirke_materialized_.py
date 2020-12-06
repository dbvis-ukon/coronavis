"""create regierungsbezirke materialized view

Revision ID: 7066fb8c8990
Revises: e34b11198249
Create Date: 2020-11-26 14:27:51.971231

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7066fb8c8990'
down_revision = 'e34b11198249'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
create materialized view regierungsbezirke as
SELECT vk.gen                                                                      AS name,
       vk.ags                                                                      AS ids,
       st_makevalid(st_simplifypreservetopology(vk.geom, 0.005::double precision)) AS geom
FROM vg250_rbz vk
WHERE vk.gf = 4
UNION
SELECT vk.gen                                                                      AS name,
       vk.ags                                                                      AS ids,
       st_makevalid(st_simplifypreservetopology(vk.geom, 0.005::double precision)) AS geom
FROM vg250_lan vk
WHERE vk.gf = 4
  AND NOT (vk.gen::text = ANY
           (ARRAY ['Baden-Württemberg'::text, 'Baden-Württemberg (Bodensee)'::text, 'Bayern'::text, 'Bayern (Bodensee)'::text, 'Hessen'::text, 'Nordrhein-Westfalen'::text]));

    """)


def downgrade():
    op.get_bind().execute("""
    drop materialized view regierungsbezirke;
    """)
