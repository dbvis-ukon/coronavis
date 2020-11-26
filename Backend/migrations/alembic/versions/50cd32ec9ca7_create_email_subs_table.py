"""create email_subs table

Revision ID: 50cd32ec9ca7
Revises: 5cf8d4366856
Create Date: 2020-11-25 21:23:23.674423

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '50cd32ec9ca7'
down_revision = '5cf8d4366856'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    -- auto-generated definition
create table email_subs
(
    id              serial                                 not null
        constraint email_subs_pk
            primary key,
    email           bytea                                  not null,
    token           bytea                                  not null,
    lang            varchar                                not null,
    email_hash      bytea                                  not null,
    token_updated   timestamp with time zone default now() not null,
    last_email_sent timestamp with time zone default now() not null,
    verified        boolean                  default false not null
);

create unique index email_subs_id_uindex
    on email_subs (id);

create unique index email_subs_email_uindex
    on email_subs (email);

create unique index email_subs_email_hash_uindex
    on email_subs (email_hash);
    """)


def downgrade():
    op.drop_table('email_subs')
