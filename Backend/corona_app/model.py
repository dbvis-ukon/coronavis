from db import db
from sqlalchemy.orm import backref
from sqlalchemy.orm import deferred
from geoalchemy2 import Geometry
import json
from collections import Counter
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
    __tablename__ = 'hospital'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
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
            'index': self.id,
            'name': self.name,
            'address': self.address,
            'contact': self.contact,
            'icu_low_state': self.icu_low_state,
            'icu_high_state': self.icu_high_state,
            'ecmo_state': self.ecmo_state,
            'last_update': self.last_update
        }
        return result

class HospitalsAggregated(db.Model):
    """
    Hospital data class
    """
    __abstract__ = True
    name = db.Column(db.String())
    ids = db.Column(db.Integer, primary_key=True)
    icu_low_state = db.Column(db.String())
    icu_high_state = db.Column(db.String())
    ecmo_state = db.Column(db.String())
    outline = db.Column(db.String())
    centroid = db.Column(db.String())

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '<Hospital in %r>' % (self.name)

    def as_dict(self):
        result = {'geometry': json.loads(self.outline)}

        result['properties'] = {
            'name': self.name,
            'ids': self.ids,
            'icu_low_state': dict(Counter(self.icu_low_state)),
            'icu_high_state': dict(Counter(self.icu_high_state)),
            'ecmo_state': dict(Counter(self.ecmo_state)),
            'centroid': json.loads(self.centroid)
        }
        return result

class HospitalsPerLandkreis(HospitalsAggregated):
    __tablename__ = "hospitals_per_landkreis"

class HospitalsPerRegierungsbezirk(HospitalsAggregated):
    __tablename__ = "hospitals_per_regierungsbezirk"

class HospitalsPerBundesland(HospitalsAggregated):
    __tablename__ = "hospitals_per_bundeslaender"


class CasesAggregated(db.Model):
    """
    Hospital data class
    """
    __abstract__ = True

    name = db.Column(db.String())
    ids = db.Column(db.Integer, primary_key=True)
    until = db.Column(db.String())
    cases = db.Column(db.Integer())
    deaths = db.Column(db.Integer())
    bevoelkerung = db.Column(db.Integer())
    outline = db.Column(db.String())

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '<Hospital in %r>' % (self.name)

    def as_dict(self):
        result = {'geometry': json.loads(self.outline)}

        result['properties'] = {
            'name': self.name,
            'ids': self.ids,
            'until': self.until,
            'cases': int(self.cases),
            'deaths': int(self.deaths),
            'bevoelkerung': int(self.bevoelkerung)
        }
        return result

class CasesPerLandkreisToday(CasesAggregated):
    __tablename__ = "cases_per_county_until_today"

class CasesPerLandkreisYesterday(CasesAggregated):
    __tablename__ = "cases_per_county_until_yesterday"

class CasesPerLandkreis3DaysBefore(CasesAggregated):
    __tablename__ = "cases_per_county_until_3daysbefore"

class CasesPerRegierungsbezirkToday(CasesAggregated):
    __tablename__ = "cases_per_regierungsbezirk_until_today"

class CasesPerRegierungsbezirkYesterday(CasesAggregated):
    __tablename__ = "cases_per_regierungsbezirk_until_yesterday"

class CasesPerRegierungsbezirk3DaysBefore(CasesAggregated):
    __tablename__ = "cases_per_regierungsbezirk_until_3daysbefore"

class CasesPerBundeslandToday(CasesAggregated):
    __tablename__ = "cases_per_bundeslaender_until_today"

class CasesPerBundeslandYesterday(CasesAggregated):
    __tablename__ = "cases_per_bundeslaender_until_yesterday"

class CasesPerBundesland3DaysBefore(CasesAggregated):
    __tablename__ = "cases_per_bundeslaender_until_3daysbefore"
