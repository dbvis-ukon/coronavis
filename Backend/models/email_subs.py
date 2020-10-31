from datetime import datetime

from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow_sqlalchemy.fields import Nested
from sqlalchemy import types

from db import db
from models.counties import CountySchema
from services.crypt_service import decrypt_message, encrypt_message
from services.hash_service import create_hash, check_hash
from services.mail_service import send_email
from services.token_service import get_token


class EncryptedColumn(types.TypeDecorator):
    impl = types.LargeBinary

    def process_bind_param(self, value, dialect):
        # convert the bind's type from String to HEX encoded
        return encrypt_message(value)

    def process_result_value(self, value, dialect):
        # convert select value from HEX encoded to String
        return decrypt_message(value)


class HashColumn(types.TypeDecorator):
    impl = types.LargeBinary

    def process_bind_param(self, value, dialect):
        # convert the bind's type from String to HEX encoded
        return create_hash(value)

    def process_result_value(self, value, dialect):
        # convert select value from HEX encoded to String
        return value


class EmailSub(db.Model):
    __tablename__ = 'email_subs'

    id = db.Column(db.Integer, primary_key=True, nullable=False, autoincrement=True)
    email = db.Column(EncryptedColumn, unique=True, nullable=False)
    email_hash = db.Column(HashColumn, unique=True, nullable=False)
    verified = db.Column(db.Boolean, nullable=False, default=False)
    token = db.Column(EncryptedColumn, nullable=False)
    lang = db.Column(db.String, nullable=False)
    token_updated = db.Column(db.TIMESTAMP, nullable=False)
    last_email_sent = db.Column(db.TIMESTAMP, nullable=False)
    counties = db.relationship('SubscribedCounties', backref='counties', cascade="all, delete-orphan", lazy=True)

    def verify_token(self, other_token):
        return self.token == other_token

    def verify_email(self, other_mail):
        return check_hash(other_mail, self.email_hash)

    def update_token(self):
        self.token = get_token(10)
        self.token_updated = datetime.now()

    def send_email(self, subject, sender, template, **kwargs):
        send_email(subject, sender, [self.email], template, **kwargs)
        self.last_email_sent = datetime.now()


class SubscribedCounties(db.Model):
    __tablename__ = 'email_subs_counties'

    ags = db.Column(db.String, db.ForeignKey('landkreise_extended.ids'), primary_key=True, nullable=False)
    sub_id = db.Column(db.Integer, db.ForeignKey('email_subs.id', ondelete='cascade'), primary_key=True, nullable=False)
    # county = db.relationship('County', backref=db.backref("email_subs_counties", uselist=False))
    county = db.relationship('County', uselist=False, lazy=True)


class SubscribedCountiesSchema(SQLAlchemyAutoSchema):
    class Meta:
        fields = ("sub_id", "ags", "county")
        model = SubscribedCounties

    county = Nested(CountySchema, many=False)


class EmailSubsSchema(SQLAlchemyAutoSchema):
    class Meta:
        fields = ("id", "email", "token", "lang", "token_updated", "last_email_sent", "counties")
        model = EmailSub

    counties = Nested(SubscribedCountiesSchema, many=True)


email_subs_schema = EmailSubsSchema()
