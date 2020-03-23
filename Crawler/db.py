import db_config

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

import geojson
import datetime

from sqlalchemy import Column, Integer, String, DateTime

from sqlalchemy.orm import backref
from sqlalchemy.orm import deferred

from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape

from sqlalchemy.dialects.postgresql import JSONB

from sqlalchemy.ext.declarative import declarative_base

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
    # contact = relationship('Person', backref='hospital', lazy=True)
    #    Column(Integer, ForeignKey('person.id'))
    location = Column(Geometry('POINT'))
    icu_low_state = Column(String(255))
    icu_high_state = Column(String(255))
    ecmo_state = Column(String(255))
    
    last_update = Column(DateTime)

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
            'status':
            self.status,
            'beds':
            self.beds
        }
        
        
class Covid19CasesLK(Base):
    """
    Covid19CasesLK data class
    """
    __tablename__ = 'covid19caseslk'
    
    # Name,Adress,String,Kontakt,Bundesland,ICU low care,ICU high care,ECMO,Stand,Location

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    name = Column(String(255), nullable=False)
    cases = Column(Integer(), nullable=False)
    deaths = Column(Integer(), nullable=False)

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '<Covid19CasesLK %r>' % (self.name)

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
        
class Covid19CasesBL(Base):
    """
    Covid19CasesBL data class
    """
    __tablename__ = 'covid19casesbl'
    
    # Name,Adress,String,Kontakt,Bundesland,ICU low care,ICU high care,ECMO,Stand,Location

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    name = Column(String(255), nullable=False)
    cases = Column(Integer(), nullable=False)
    deaths = Column(Integer(), nullable=False)

    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)

    def __repr__(self):
        return '<Covid19CasesLK %r>' % (self.name)

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