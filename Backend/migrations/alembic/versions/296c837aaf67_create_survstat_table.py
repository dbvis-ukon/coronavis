"""create survstat table

Revision ID: 296c837aaf67
Revises: d5d392162842
Create Date: 2021-03-12 17:41:02.421128

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '296c837aaf67'
down_revision = 'd5d392162842'
branch_labels = None
depends_on = None

ages = ""

for a in range(0, 80):
    ages += "A{:02d} int not null,".format(a)


def upgrade():
    op.get_bind().execute("""
    -- auto-generated definition
create table survstat_cases_agegroup
(
    ags varchar(6) not null,
    year int not null,
    week int not null,
    A00 int not null,
    A01 int not null,
    A02 int not null,
    A03 int not null,
    A04 int not null,
    A05 int not null,
    A06 int not null,
    A07 int not null,
    A08 int not null,
    A09 int not null,
    A10 int not null,
    A11 int not null,
    A12 int not null,
    A13 int not null,
    A14 int not null,
    A15 int not null,
    A16 int not null,
    A17 int not null,
    A18 int not null,
    A19 int not null,
    A20 int not null,
    A21 int not null,
    A22 int not null,
    A23 int not null,
    A24 int not null,
    A25 int not null,
    A26 int not null,
    A27 int not null,
    A28 int not null,
    A29 int not null,
    A30 int not null,
    A31 int not null,
    A32 int not null,
    A33 int not null,
    A34 int not null,
    A35 int not null,
    A36 int not null,
    A37 int not null,
    A38 int not null,
    A39 int not null,
    A40 int not null,
    A41 int not null,
    A42 int not null,
    A43 int not null,
    A44 int not null,
    A45 int not null,
    A46 int not null,
    A47 int not null,
    A48 int not null,
    A49 int not null,
    A50 int not null,
    A51 int not null,
    A52 int not null,
    A53 int not null,
    A54 int not null,
    A55 int not null,
    A56 int not null,
    A57 int not null,
    A58 int not null,
    A59 int not null,
    A60 int not null,
    A61 int not null,
    A62 int not null,
    A63 int not null,
    A64 int not null,
    A65 int not null,
    A66 int not null,
    A67 int not null,
    A68 int not null,
    A69 int not null,
    A70 int not null,
    A71 int not null,
    A72 int not null,
    A73 int not null,
    A74 int not null,
    A75 int not null,
    A76 int not null,
    A77 int not null,
    A78 int not null,
    A79 int not null,
    \"A80+\" int not null,
    Unbekannt int not null,

    constraint survstat_cases_agegroup_pk
        primary key (ags, year, week)
);
    """)


def downgrade():
    op.drop_table('survstat_cases_agegroup')
