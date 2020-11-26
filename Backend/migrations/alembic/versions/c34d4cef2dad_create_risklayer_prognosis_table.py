"""create risklayer_prognosis table

Revision ID: c34d4cef2dad
Revises: 91aca0bccf3f
Create Date: 2020-11-25 21:28:24.950572

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c34d4cef2dad'
down_revision = '91aca0bccf3f'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    create table risklayer_prognosis
(
    datenbestand timestamp with time zone not null,
    prognosis    double precision         not null
);
    """)


def downgrade():
    op.drop_table('risklayer_prognosis')
