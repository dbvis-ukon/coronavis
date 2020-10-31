from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from db import db


class County(db.Model):
    __tablename__ = 'landkreise_extended'

    ags = db.Column('ids', db.String, primary_key=True, nullable=False, )
    name = db.Column(db.String, nullable=False)
    desc = db.Column('bez', db.String, nullable=False)


class CountySchema(SQLAlchemyAutoSchema):
    class Meta:
        fields = ("ags", "name", "desc")
        model = County


county_schema = CountySchema()
