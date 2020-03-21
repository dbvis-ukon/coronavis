from db import db
from sqlalchemy.orm import backref
from sqlalchemy.orm import deferred
from geoalchemy2 import Geometry
import geojson
from geoalchemy2.shape import to_shape
from sqlalchemy.dialects.postgresql import JSONB


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


beds = db.Table(
    'hospital_beds',
    db.Column('hospital_id',
              db.Integer,
              db.ForeignKey('hospital.id'),
              primary_key=True),
    db.Column('bed_id', db.Integer, db.ForeignKey('bed.id'), primary_key=True),
    db.Column('status', db.String(255), nullable=False),
    db.Column('crawl_time', db.DateTime(), nullable=False),
    db.Column('updated', db.DateTime(), nullable=False))


class Hospital(db.Model):
    """
    Hospital data class
    """
    __tablename__ = 'hospital'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    state = db.Column(db.String(255), nullable=False)
    contact = db.relationship('Person', backref='hospital', lazy=True)
    #    db.Column(db.Integer, db.ForeignKey('person.id'))
    location = db.Column(Geometry('POINT'), nullable=False)
    status = db.Column(db.String(255))
    beds = db.relationship('Bed',
                           secondary=beds,
                           lazy='subquery',
                           backref=db.backref('hospitals', lazy=True))

    def __init__(self, lat, long, **kwargs):
        self.location = 'POINT(' + str(lat) + ' ' + str(long) + ')'
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '<Hospital %r>' % (self.name)

    def as_dict(self):
        return {
            'id':
            self.id,
            'name':
            self.name,
            'address':
            self.address,
            'state':
            self.state,
            'location':
            geojson.Feature(geometry=(to_shape(self.location)), properties={}),
            'status':
            self.status,
            'beds':
            self.beds
        }


class Person(db.Model):
    """
    Person data class
    """
    # db table name
    __tablename__ = 'person'

    # columns
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(255), nullable=False)

    # realtionship to dataset table
    hospital_id = db.Column(db.Integer,
                            db.ForeignKey('hospital.id'),
                            nullable=False)

    def __init__(self, hospital_id, **kwargs):
        self.hospital_id = hospital_id
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '(' + str(self.hospital_id) + ',' + self.name + ')'

    def as_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'hospital_id': self.hospital_id,
            'phone': self.phone
        }


class Bed(db.Model):
    """
    Bed data class
    """
    # db table name
    __tablename__ = 'bed'

    # columns
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    bed_type = db.Column(db.String(255))
    description = db.Column(db.String(255))

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '(' + self.name + ')'
