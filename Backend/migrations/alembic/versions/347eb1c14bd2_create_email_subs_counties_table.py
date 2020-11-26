"""create email_subs_counties table

Revision ID: 347eb1c14bd2
Revises: 50cd32ec9ca7
Create Date: 2020-11-25 21:24:32.394944

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '347eb1c14bd2'
down_revision = '50cd32ec9ca7'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    -- auto-generated definition
create table email_subs_counties
(
    sub_id integer not null
        constraint email_subs_counties_email_subs_id_fk
            references email_subs
            on delete cascade,
    ags    varchar not null,
    constraint email_subs_counties_pk
        primary key (ags, sub_id)
);
    """)


def downgrade():
    op.drop_table('email_subs_counties')
