import json
from collections import Counter

from db import db


class Hospital(db.Model):
    """
    Hospital data class
    """
    __tablename__ = 'hospitals_current'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    state = db.Column(db.String(255), nullable=False)
    contact = db.Column(db.String(255))
    geojson = db.Column(db.JSON())
    icu_low_state = db.Column(db.String(255))
    icu_high_state = db.Column(db.String(255))
    ecmo_state = db.Column(db.String(255))
    last_update = db.Column(db.DateTime())
    helipad_nearby = db.Column(db.Boolean())

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '<Hospital %r>' % self.name

    def as_dict(self):
        result = {'geometry': self.geojson, 'properties': {
            'index': self.id,
            'name': self.name,
            'address': self.address,
            'contact': self.contact,
            'icu_low_state': self.icu_low_state,
            'icu_high_state': self.icu_high_state,
            'ecmo_state': self.ecmo_state,
            'last_update': self.last_update,
            'helipad_nearby': self.helipad_nearby
        }}
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
        return '<Hospital in %r>' % self.name

    def as_dict(self):
        result = {'geometry': json.loads(self.outline), 'properties': {
            'name': self.name,
            'ids': self.ids,
            'icu_low_state': dict(Counter(self.icu_low_state)),
            'icu_high_state': dict(Counter(self.icu_high_state)),
            'ecmo_state': dict(Counter(self.ecmo_state)),
            'centroid': json.loads(self.centroid)
        }}

        return result


class HospitalsPerLandkreis(HospitalsAggregated):
    __tablename__ = "hospitals_per_landkreis"


class HospitalsPerRegierungsbezirk(HospitalsAggregated):
    __tablename__ = "hospitals_per_regierungsbezirk"


class HospitalsPerBundesland(HospitalsAggregated):
    __tablename__ = "hospitals_per_bundeslaender"
