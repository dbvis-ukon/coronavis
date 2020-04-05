import datetime

import db_config
import geojson
from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape
from sqlalchemy import (Column, DateTime, Float, ForeignKey, Integer, String,
                        create_engine)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import (backref, deferred, relationship, scoped_session,
                            sessionmaker)

Base = declarative_base()

engine = create_engine(db_config.SQLALCHEMY_DATABASE_URI)


def create_session():
    """ Create a scoped session -

    the scoped_session() function is provided which produces a thread-managed registry of Session objects.
    It is commonly used in web applications so that a single global variable can be used to safely
    represent transactional sessions with sets of objects, localized to a single thread.

    """
    session = scoped_session(sessionmaker())
    session.configure(bind=engine, autoflush=False, expire_on_commit=False, autocommit=False)
    return session


Session = create_session()
sess = Session()


class Crawl(Base):
    """
    Hospital data class
    """
    __tablename__ = 'crawl'

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    url = Column(String, nullable=False)
    text = Column(String)
    doc = deferred(Column(JSONB))

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return self.text
    
    
class VegaData(Base):
    """
    Hospital data class
    """
    __tablename__ = 'vegadata'

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    text = Column(String)
    doc = deferred(Column(JSONB))

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return self.text


class Hospital(Base):
    """
    Hospital data class
    """
    __tablename__ = 'hospital'
    
    # Name,Adress,String,Kontakt,Bundesland,ICU low care,ICU high care,ECMO,Stand,Location

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    contact = Column(String(255))
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    icu_low_state = Column(String(255))
    icu_high_state = Column(String(255))
    ecmo_state = Column(String(255))
    
    last_update = Column(DateTime)
    
    insert_date = Column(DateTime, default=datetime.datetime.utcnow)

    def __init__(self, **kwargs):
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
        }
        
        
class Beds(Base):
    """
    Bed data class
    """
    # db table name
    __tablename__ = 'beds'

    # columns
    id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id = Column(Integer, ForeignKey('hospital_extended.id'), nullable=False)
    name = Column(String(255), nullable=False)
    available_beds = Column(Integer)
    casesecmoyear = Column(Integer)
    bed_type = Column(String(255))
    description = Column(String(255))
    
    last_update = Column(DateTime)
    
    insert_date = Column(DateTime, default=datetime.datetime.utcnow)

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '(' + self.name + ')'

        
        
class HospitalExtended(Base):
    """
    HospitalExtended data class
    """
    __tablename__ = 'hospital_extended'
    
    # Name,Adress,String,Kontakt,Bundesland,ICU low care,ICU high care,ECMO,Stand,Location

    id = Column(Integer, primary_key=True, autoincrement=True)
    hospital_id = Column(Integer)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    contact = Column(String(255))
    location = Column(Geometry(geometry_type='POINT', srid=4326))
    icu_low_state = Column(String(255))
    icu_high_state = Column(String(255))
    ecmo_state = Column(String(255))
    
    covidcases = Column(Integer)
    
    last_update = Column(DateTime)
    
    insert_date = Column(DateTime, default=datetime.datetime.utcnow)

    def __init__(self, **kwargs):
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
        }
        
        
class CasesLK(Base):
    """
    CasesLK data class
    """
    __tablename__ = 'caseslk'
    
    # Inserted Date, Name, Description, Bundesland, Whole County Name, Cases, Deaths, Population, Death Rate, Cases per 100k, Cases per population

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    name = Column(String(255), nullable=False)
    desc = Column(String(255), nullable=False)
    bl = Column(String(255), nullable=False)
    county = Column(String(255), nullable=False)
    cases = Column(Integer(), nullable=False)
    deaths = Column(Integer(), nullable=False)
    population = Column(Integer(), nullable=False)
    death_rate = Column(Float(), nullable=False)
    cases_per_100k = Column(Float(), nullable=False)
    cases_per_population = Column(Float(), nullable=False)

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '<CasesLK %r>' % (self.name)

    def as_dict(self):
        return {
            'id':
            self.id,
            'name':
            self.name,
            'cases':
            self.cases,
            'deaths':
            self.deaths
        }
        
class CasesBL(Base):
    """
    CasesBL data class
    """
    __tablename__ = 'casesbl'
    
    # Inserted Date, Name, Description, Cases, Deaths, Population

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    name = Column(String(255), nullable=False)
    desc = Column(String(255), nullable=False)
    cases = Column(Integer(), nullable=False)
    deaths = Column(Integer(), nullable=False)
    population = Column(Integer(), nullable=False)

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '<CasesBL %r>' % (self.name)

    def as_dict(self):
        return {
            'id':
            self.id,
            'name':
            self.name,
            'cases':
            self.cases,
            'deaths':
            self.deaths
        }

Base.metadata.create_all(engine)
