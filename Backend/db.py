import config

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

engine = create_engine(config.SQLALCHEMY_DATABASE_URI)


def create_session():
    """ Create a scoped session -

    the scoped_session() function is provided which produces a thread-managed registry of Session objects.
    It is commonly used in web applications so that a single global variable can be used to safely
    represent transactional sessions with sets of objects, localized to a single thread.

    """
    session = scoped_session(sessionmaker())
    session.configure(bind=engine, autoflush=False, expire_on_commit=False, autocommit=False)
    return session

db = SQLAlchemy()
 
def query_to_list(query, include_field_names=True):
    """Turns a SQLAlchemy query into a list of data values."""
    column_names = []
    for i, obj in enumerate(query.all()):
        if i == 0:
            column_names = [c.name for c in obj.__table__.columns]
            if include_field_names:
                yield column_names
        yield obj_to_list(obj, column_names)


def obj_to_list(sa_obj, field_order):
    """Takes a SQLAlchemy object - returns a list of all its data"""
    return [getattr(sa_obj, field_name, None) for field_name in field_order]
