"""create cases_lk_risklayer table

Revision ID: 2ea7edb628ac
Revises: 3610493d8979
Create Date: 2020-11-25 20:43:50.998184

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '2ea7edb628ac'
down_revision = '3610493d8979'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    create table cases_lk_risklayer
(
    datenbestand  timestamp with time zone not null,
    ags           varchar(10)              not null,
    cases         integer                  not null,
    deaths        integer,
    updated_today boolean                  not null,
    created_at    timestamp with time zone,
    updated_at    timestamp with time zone,
    date          date,
    constraint no_crawl_duplicates
        unique (date, ags)
);

create index index_datenbestand
    on cases_lk_risklayer (datenbestand);

create index cases_lk_risklayer_ags_index
    on cases_lk_risklayer (ags);

create index cases_lk_risklayer_date_index
    on cases_lk_risklayer (date);

create index cases_lk_risklayer_updated_at_index
    on cases_lk_risklayer (updated_at);

create index cases_lk_risklayer_ags_updated_at_index
    on cases_lk_risklayer (ags asc, updated_at desc);
    
    create function update_modified_column() returns trigger
    language plpgsql
as
$$
BEGIN
   IF New.updated_today = true AND OLD.created_at IS NULL THEN
      NEW.created_at = now();
   end if;
   IF (NEW.cases != OLD.cases OR NEW.deaths != OLD.deaths) AND NEW.updated_today = true THEN
      NEW.updated_at = now();
   END IF;
   RETURN NEW;
END;
$$;

create trigger cases_lk_risklayer_updated_at
before update
on cases_lk_risklayer
for each row
execute procedure update_modified_column();
    """)


def downgrade():
    op.drop_table('cases')
