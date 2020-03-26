from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import deferred

from db import db


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
