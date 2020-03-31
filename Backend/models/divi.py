from sqlalchemy import PrimaryKeyConstraint

from db import db


class HospitalDevelopment(db.Model):
    """
    Hospital data class
    """
    __tablename__ = 'divi_hospitals_development'

    __table_args__ = (
        PrimaryKeyConstraint('gemeindeschluessel', 'ort', 'bundeslandschluessel', 'plz', 'webaddresse'),
    )

    gemeindeschluessel = db.Column(db.String())
    ort = db.Column(db.String())
    bundeslandschluessel = db.Column(db.String())
    plz = db.Column(db.String())
    webaddresse = db.Column(db.String())
    geojson = db.Column(db.JSON())
    id = db.Column(db.Integer())
    name = db.Column(db.JSON())
    address = db.Column(db.JSON())
    state = db.Column(db.JSON())
    contact = db.Column(db.JSON())
    helipad_nearby = db.Column(db.Boolean())
    icu_low_care_frei = db.Column(db.JSON())
    icu_low_care_belegt = db.Column(db.JSON())
    icu_low_care_einschaetzung = db.Column(db.JSON())
    icu_low_care_in_24h = db.Column(db.JSON())
    icu_high_care_frei = db.Column(db.JSON())
    icu_high_care_belegt = db.Column(db.JSON())
    icu_high_care_einschaetzung = db.Column(db.JSON())
    icu_high_care_in_24h = db.Column(db.JSON())
    icu_ecmo_care_frei = db.Column(db.JSON())
    icu_ecmo_care_belegt = db.Column(db.JSON())
    icu_ecmo_care_einschaetzung = db.Column(db.JSON())
    icu_ecmo_care_in_24h = db.Column(db.JSON())
    ecmo_faelle_jahr = db.Column(db.JSON())
    covid19_aktuell = db.Column(db.JSON())
    covid19_kumulativ = db.Column(db.JSON())
    covid19_beatmet = db.Column(db.JSON())
    covid19_verstorben = db.Column(db.JSON())

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return f'<DIVI Hospital Development {self.ort}>'

    def as_dict(self):
        result = {'geometry': self.geojson,
                  'properties': {
                      'gemeindeschluessel': self.gemeindeschluessel,
                      'ort': self.ort,
                      'bundeslandschluessel': self.bundeslandschluessel,
                      'plz': self.plz,
                      'webaddresse': self.webaddresse,
                      'id': self.id,
                      'name': self.name,
                      'address': self.address,
                      'state': self.state,
                      'contact': self.contact,
                      'helipad_nearby': self.helipad_nearby,
                      'icu_low_care_frei': self.icu_low_care_frei,
                      'icu_low_care_belegt': self.icu_low_care_belegt,
                      'icu_low_care_einschaetzung': self.icu_low_care_einschaetzung,
                      'icu_low_care_in_24h': self.icu_low_care_in_24h,
                      'icu_high_care_frei': self.icu_high_care_frei,
                      'icu_high_care_belegt': self.icu_high_care_belegt,
                      'icu_high_care_einschaetzung': self.icu_high_care_einschaetzung,
                      'icu_high_care_in_24h': self.icu_high_care_in_24h,
                      'icu_ecmo_care_frei': self.icu_ecmo_care_frei,
                      'icu_ecmo_care_belegt': self.icu_ecmo_care_belegt,
                      'icu_ecmo_care_einschaetzung': self.icu_ecmo_care_einschaetzung,
                      'icu_ecmo_care_in_24h': self.icu_ecmo_care_in_24h,
                      'ecmo_faelle_jahr': self.ecmo_faelle_jahr,
                      'covid19_aktuell': self.covid19_aktuell,
                      'covid19_kumulativ': self.covid19_kumulativ,
                      'covid19_beatmet': self.covid19_beatmet,
                      'covid19_verstorben': self.covid19_verstorben
                  }}

        return result


class HospitalDevelopmentAggregated(db.Model):
    """
    Hospital data class
    """
    __abstract__ = True

    name = db.Column(db.String())
    ids = db.Column(db.String(), primary_key=True)
    geojson = db.Column(db.JSON())
    centroid = db.Column(db.JSON())
    icu_low_care_frei = db.Column(db.JSON())
    icu_low_care_belegt = db.Column(db.JSON())
    icu_low_care_einschaetzung = db.Column(db.JSON())
    icu_low_care_in_24h = db.Column(db.JSON())
    icu_high_care_frei = db.Column(db.JSON())
    icu_high_care_belegt = db.Column(db.JSON())
    icu_high_care_einschaetzung = db.Column(db.JSON())
    icu_high_care_in_24h = db.Column(db.JSON())
    icu_ecmo_care_frei = db.Column(db.JSON())
    icu_ecmo_care_belegt = db.Column(db.JSON())
    icu_ecmo_care_einschaetzung = db.Column(db.JSON())
    icu_ecmo_care_in_24h = db.Column(db.JSON())
    ecmo_faelle_jahr = db.Column(db.JSON())
    covid19_aktuell = db.Column(db.JSON())
    covid19_kumulativ = db.Column(db.JSON())
    covid19_beatmet = db.Column(db.JSON())
    covid19_verstorben = db.Column(db.JSON())

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return f'<DIVI Hospital Development {self.name}>'

    def as_dict(self):
        result = {'geometry': self.geojson,
                  'properties': {
                      'name': self.name,
                      'ids': self.ids,
                      'centroid': self.centroid,
                      'icu_low_care_frei': self.icu_low_care_frei,
                      'icu_low_care_belegt': self.icu_low_care_belegt,
                      'icu_low_care_einschaetzung': self.icu_low_care_einschaetzung,
                      'icu_low_care_in_24h': self.icu_low_care_in_24h,
                      'icu_high_care_frei': self.icu_high_care_frei,
                      'icu_high_care_belegt': self.icu_high_care_belegt,
                      'icu_high_care_einschaetzung': self.icu_high_care_einschaetzung,
                      'icu_high_care_in_24h': self.icu_high_care_in_24h,
                      'icu_ecmo_care_frei': self.icu_ecmo_care_frei,
                      'icu_ecmo_care_belegt': self.icu_ecmo_care_belegt,
                      'icu_ecmo_care_einschaetzung': self.icu_ecmo_care_einschaetzung,
                      'icu_ecmo_care_in_24h': self.icu_ecmo_care_in_24h,
                      'ecmo_faelle_jahr': self.ecmo_faelle_jahr,
                      'covid19_aktuell': self.covid19_aktuell,
                      'covid19_kumulativ': self.covid19_kumulativ,
                      'covid19_beatmet': self.covid19_beatmet,
                      'covid19_verstorben': self.covid19_verstorben
                  }}

        return result


class HospitalsDevelopmentPerLandkreis(HospitalDevelopmentAggregated):
    __tablename__ = "divi_hospitals_development_landkreise"


class HospitalsDevelopmentPerRegierungsbezirk(HospitalDevelopmentAggregated):
    __tablename__ = "divi_hospitals_development_regierungsbezirke"


class HospitalsDevelopmentPerBundesland(HospitalDevelopmentAggregated):
    __tablename__ = "divi_hospitals_development_bundeslaender"
