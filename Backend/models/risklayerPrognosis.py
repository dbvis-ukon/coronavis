from db import db


class RisklayerPrognosis(db.Model):
    __tablename__ = 'risklayer_prognosis'

    datenbestand = db.Column(db.TIMESTAMP, primary_key=True, nullable=False)
    prognosis = db.Column(db.Float, nullable=False)

# class RisklayerPrognosisSchema(SQLAlchemyAutoSchema):
#     class Meta:
#         strict = True
#         model = RisklayerPrognosis
#
# timestamp = fields.Timestamp(data_key="datenbestand")
#     prognosis = fields.Number(data_key="prognosis")
