"""add rki_agegroup2 table

Revision ID: cea34abda294
Revises: 86ec65c533a4
Create Date: 2021-03-17 19:27:41.684146

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cea34abda294'
down_revision = '86ec65c533a4'
branch_labels = None
depends_on = None


def upgrade():
    op.get_bind().execute("""
CREATE TABLE public.population_rki_agegroup2 (
    ags character varying NOT NULL,
    "A00-A04" integer,
    "A05-A14" integer,
    "A15-A34" integer,
    "A35-A59" integer,
    "A60-A79" integer,
    "A80+" integer
);


ALTER TABLE public.population_rki_agegroup2 OWNER TO coronavis;

--
-- Data for Name: population_rki_agegroup2; Type: TABLE DATA; Schema: public; Owner: coronavis
--

INSERT INTO public.population_rki_agegroup2 VALUES ('09472', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11000', 146400, 316608, 827496, 1186836, 675192, 182136);
INSERT INTO public.population_rki_agegroup2 VALUES ('06632', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05382', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09262', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11001', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14511', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03453', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05766', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08237', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15089', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06635', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07235', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09161', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01003', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07331', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09172', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09175', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14626', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01053', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09675', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('10042', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09374', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03458', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12070', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06439', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03359', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07131', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09473', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09679', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11008', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09272', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09463', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07311', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08118', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08231', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07211', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09371', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06431', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16061', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03159', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('10046', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16069', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05154', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16053', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08337', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08327', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15003', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09771', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07135', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05378', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05158', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03455', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07138', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05966', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08216', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03451', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07231', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('10041', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09176', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09774', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03254', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08417', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('13076', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08335', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11003', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12052', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12053', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08425', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07317', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05558', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08421', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06631', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03257', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07312', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07315', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15082', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08426', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09182', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12062', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09673', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05754', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03256', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08416', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05958', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05570', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08317', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09476', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08436', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16077', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03352', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09188', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09179', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08336', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11012', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06411', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14524', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06412', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09571', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07134', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08316', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03252', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06434', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08222', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09477', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01059', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12054', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09363', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07132', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09676', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09174', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01054', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09573', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09187', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03459', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12073', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08212', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05562', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16063', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09671', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07232', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03354', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03454', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03353', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11005', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09475', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01061', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07336', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03401', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08311', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15081', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12061', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03241', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09180', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09764', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16066', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05770', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09362', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09772', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08435', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16062', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05954', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('13072', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15085', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08136', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08126', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16055', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16065', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09276', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03360', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06611', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03355', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09171', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09190', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06432', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07334', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11006', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05566', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15001', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09563', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03452', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05554', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08236', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12063', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06532', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09361', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14522', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05116', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05120', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07332', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03255', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09271', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14730', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09375', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06531', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06634', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09777', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03357', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06435', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09762', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08315', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05978', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09177', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16071', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09674', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06414', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11007', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05913', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05513', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15090', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09672', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03251', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03151', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09181', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09561', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05762', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12064', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05117', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('13074', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15084', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08119', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09572', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03356', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09376', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03358', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09576', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09677', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09763', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09163', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07133', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09773', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16064', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03153', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11009', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16070', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09577', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14612', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16052', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03405', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09274', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08115', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01062', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14521', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05962', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08135', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09661', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09162', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03155', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09173', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01058', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09279', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08128', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01055', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16067', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09277', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15086', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08326', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01002', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15083', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08116', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('13003', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08125', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09778', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05711', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05112', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03457', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06636', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05914', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03103', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09471', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09183', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01051', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09278', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03456', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09761', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07335', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09574', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05515', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12068', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08235', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08415', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05366', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08325', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05370', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09678', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07111', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12060', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06436', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09779', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16076', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14729', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05911', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08215', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05111', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03460', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09184', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15002', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03102', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03351', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05170', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09474', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07319', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14628', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03154', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09780', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08211', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05774', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01004', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05362', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14625', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07333', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16074', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06433', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08127', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06633', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07339', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05114', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09478', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09178', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05758', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05314', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08225', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16056', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03361', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('02000', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09565', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09372', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05374', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03461', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16068', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09461', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09275', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07140', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07316', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05124', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05358', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16075', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15087', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08117', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09273', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01060', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06533', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05315', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09775', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05512', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03402', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05915', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05162', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12065', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05166', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09776', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09662', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03157', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07337', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09462', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07143', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06534', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09564', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15088', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09663', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05970', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09185', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07313', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07141', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12051', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16051', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12066', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06535', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08221', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09186', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('13004', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07137', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07340', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11004', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06440', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16073', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08226', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05119', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08437', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09373', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07320', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03101', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09562', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09261', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06437', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11002', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('13071', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01056', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14523', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08121', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07338', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12072', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05122', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('15091', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('10043', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05974', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('04011', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05113', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06413', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05334', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12067', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11011', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14713', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('14627', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01057', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('13075', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('10045', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('04012', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09377', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05916', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09575', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03462', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16072', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07318', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('11010', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('06438', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('01001', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('05316', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03403', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12069', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09464', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('13073', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('10044', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09189', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03158', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09263', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('12071', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07314', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('03404', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('09479', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('07233', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('08111', 12200, 26384, 68958, 98903, 56266, 15178);
INSERT INTO public.population_rki_agegroup2 VALUES ('16054', 12200, 26384, 68958, 98903, 56266, 15178);


--
-- Name: population_rki_agegroup2 population_rki_agegroup2_pk; Type: CONSTRAINT; Schema: public; Owner: coronavis
--

ALTER TABLE ONLY public.population_rki_agegroup2
    ADD CONSTRAINT population_rki_agegroup2_pk PRIMARY KEY (ags);
    """)


def downgrade():
    op.drop_table('population_rki_agegroup2')
