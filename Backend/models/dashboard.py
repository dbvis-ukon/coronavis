from datetime import datetime
from tzlocal import get_localzone

from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

from db import db

class Dashboard(db.Model):
    __tablename__ = 'dashboards'

    id = db.Column(db.String, primary_key=True, nullable=False, autoincrement=False, unique=True)
    dashboard = db.Column(db.JSON, unique=False, nullable=False)
    upvotes = db.Column(db.Integer, unique=False, nullable=False, default=0)
    visits = db.Column(db.Integer, unique=False, nullable=False, default=0)
    created_at = db.Column(db.TIMESTAMP, nullable=False, default=datetime.now(tz=get_localzone()))
    parent_id = db.Column(db.String, nullable=True)


class DashboardsSchema(SQLAlchemyAutoSchema):
    class Meta:
        fields = ("id", "dashboard", "upvotes", "visits", "created_at")
        model = Dashboard


dashboard_schema = DashboardsSchema()
