from db import db
from sqlalchemy.orm import backref
from sqlalchemy.orm import deferred
from geoalchemy2 import Geometry
import geojson
from geoalchemy2.shape import to_shape
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func


class Crawl(db.Model):
    """
    Hospital data class
    """
    __tablename__ = 'crawl'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    url = db.Column(db.String, nullable=False)
    text = db.Column(db.String)
    doc = deferred(db.Column(JSONB))

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return self.text


class Hospital(db.Model):
    """
    Hospital data class
    """
    __tablename__ = 'hospitals_crawled'

    index = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    state = db.Column(db.String(255), nullable=False)
    contact = db.Column(db.String(255))
    location = db.Column(Geometry('POINT'))
    icu_low_state = db.Column(db.String(255))
    icu_high_state = db.Column(db.String(255))
    ecmo_state = db.Column(db.String(255))
    last_update = db.Column(db.DateTime())

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '<Hospital %r>' % (self.name)

    def as_dict(self):
        result = geojson.Feature(geometry=(to_shape(self.location)),
                                 properties={})
        result['properties'] = {
            'index': self.index,
            'name': self.name,
            'address': self.address,
            'contact': self.contact,
            'icu_low_state': self.icu_low_state,
            'icu_high_state': self.icu_high_state,
            'ecmo_state': self.ecmo_state,
            'last_update': self.last_update
        }
        return result
