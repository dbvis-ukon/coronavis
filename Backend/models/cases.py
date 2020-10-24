import json

from db import db


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
        return '<Hospital in %r>' % self.name

    def as_dict(self):
        result = {'geometry': json.loads(self.outline), 'properties': {
            'name': self.name,
            'ids': self.ids,
            'until': self.until,
            'cases': int(self.cases),
            'deaths': int(self.deaths),
            'bevoelkerung': int(self.bevoelkerung)
        }}

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
