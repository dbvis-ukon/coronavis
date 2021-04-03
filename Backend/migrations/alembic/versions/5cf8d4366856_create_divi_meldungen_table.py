"""create divi_meldungen table

Revision ID: 5cf8d4366856
Revises: 56a467c77bd8
Create Date: 2020-11-25 21:20:46.363912

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '5cf8d4366856'
down_revision = '56a467c77bd8'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
    -- auto-generated definition
create table divi_meldungen
(
    meldezeitpunkt                           timestamp with time zone               not null,
    kh_id                                    integer                                not null
        constraint divi_meldungen_divi_krankenhaus_standorte_id_fk
            references divi_krankenhaus_standorte,
    bettenmeldungecmo                        text,
    bettenmeldunglowcare                     text,
    bettenmeldunghighcare                    text,
    faellecovidaktuell                       integer,
    faellecovidaktuellbeatmet                integer,
    faellecovidgenesen                       integer,
    faellecovidverstorben                    integer,
    betriebssituation                        text,
    betriebseinschraenkungpersonal           boolean,
    betriebseinschraenkungraum               boolean,
    betriebseinschraenkungbeatmungsgeraet    boolean,
    betriebseinschraenkungverbrauchsmaterial boolean,
    meldebereiche                            text[],
    ardsnetzwerkmitglied                     boolean,
    intensivbetten                           integer,
    intensivbettenbelegt                     integer,
    patienteninvasivbeatmet                  integer,
    patientenecmo                            integer,
    freieivkapazitaet                        integer,
    freieecmokapazitaet                      integer,
    intensivbettennotfall7d                  integer,
    statuseinschaetzunglowcare               text,
    statuseinschaetzunghighcare              text,
    statuseinschaetzungecmo                  text,
    behandlungsschwerpunktl1                 text[],
    behandlungsschwerpunktl2                 text[],
    behandlungsschwerpunktl3                 text[],
    private                                  boolean                  default false not null,
    created_at                               timestamp with time zone default now() not null,
    updated_at                               timestamp with time zone,
    constraint divi_meldungen_pk
        primary key (meldezeitpunkt, kh_id, private)
);

create unique index divi_meldung_pk_uindex
    on divi_meldungen (meldezeitpunkt, kh_id, private);
    
    create function updated_at_standard() returns trigger
    language plpgsql
as
$$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$;

    create trigger divi_meldungen_updated_at
    before update
    on divi_meldungen
    for each row
    execute procedure updated_at_standard();
    """)


def downgrade():
    op.drop_table('divi_meldungen')
