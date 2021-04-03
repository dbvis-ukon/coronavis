"""add columns to divi_meldungen

Revision ID: a3a5ae77b6b9
Revises: bbaf5488b4fe
Create Date: 2021-03-23 11:42:48.229731

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'a3a5ae77b6b9'
down_revision = 'bbaf5488b4fe'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
        ALTER TABLE divi_meldungen ADD COLUMN faellecovidaktuellnichtinvasivbeatmet int;
        ALTER TABLE divi_meldungen ADD COLUMN faellecovidaktuellecmo int;
    """)


def downgrade():
    op.get_bind().execute("""
        ALTER TABLE divi_meldungen DROP COLUMN faellecovidaktuellnichtinvasivbeatmet;
        ALTER TABLE divi_meldungen DROP COLUMN faellecovidaktuellecmo;
    """)
