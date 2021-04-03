"""create cases_current view

Revision ID: b84312f6532e
Revises: 00a7bf4dae6c
Create Date: 2020-11-26 14:43:32.346113

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'b84312f6532e'
down_revision = '00a7bf4dae6c'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    create view cases_current
            (datenbestand, idbundesland, bundesland, landkreis, objectid, meldedatum, gender, agegroup, casetype, id,
             idlandkreis) as
SELECT cases.datenbestand,
       cases.idbundesland,
       cases.bundesland,
       cases.landkreis,
       cases.objectid,
       cases.meldedatum,
       cases.gender,
       cases.agegroup,
       cases.casetype,
       cases.id,
       cases.idlandkreis
FROM cases
WHERE cases.datenbestand = ((SELECT max(cases_1.datenbestand) AS max
                             FROM cases cases_1));
    """)


def downgrade():
    op.get_bind().execute("""
    drop view cases_current;
    """)
