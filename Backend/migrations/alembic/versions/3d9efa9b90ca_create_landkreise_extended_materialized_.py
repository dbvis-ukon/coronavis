"""create landkreise_extended materialized view

Revision ID: 3d9efa9b90ca
Revises: 7347754aab0f
Create Date: 2020-11-25 21:44:46.947496

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '3d9efa9b90ca'
down_revision = '7347754aab0f'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    create materialized view landkreise_extended as
SELECT vg250_krs.gen                                                                      AS name,
       vg250_krs.bez,
       vg250_krs.ags                                                                      AS ids,
       st_makevalid(st_simplifypreservetopology(vg250_krs.geom, 0.005::double precision)) AS geom
FROM vg250_krs
WHERE vg250_krs.gf = 4;
    """)


def downgrade():
    op.get_bind().execute("""
    drop materialized view landkreise_extended;
    """)
