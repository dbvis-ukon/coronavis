import os
from datetime import datetime, timedelta, timezone

from flask import Blueprint, request

from services.hash_service import create_hash

routes = Blueprint('email-subs', __name__, url_prefix='/sub')

from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import BadRequest, Forbidden

from db import db
from models.caseDevelopments import CaseDevelopments
from models.email_subs import EmailSub, EmailSubsSchema, email_subs_schema, SubscribedCounties
from services.crypt_service import decrypt_message
# noinspection PyUnresolvedReferences
from psycopg2.errors import UniqueViolation
from models.risklayer_prognosis import RisklayerPrognosis


@routes.route('/', methods=['POST'])
def subscribe_new():
    """
        Add a new subscription
    """
    schema = EmailSubsSchema(exclude=['id', 'token'])
    try:
        new_sub = EmailSub(
            email=request.json['email'],
            email_hash=request.json['email'],
            lang=request.json['lang'],
            last_email_sent=datetime.now(timezone.utc)
        )
        new_sub.update_token()
        db.session.add(new_sub)
        db.session.flush()

        counties = []
        if 'counties' in request.json:
            counties = request.json['counties']

        for cjson in counties:
            c = SubscribedCounties()
            c.sub_id = new_sub.id
            c.ags = cjson['ags']
            db.session.add(c)

        db.session.commit()

        new_sub.send_email(
            subject='[CoronaVis] Verifiziere deine E-Mail-Adresse',
            sender='coronavis@dbvis.inf.uni-konstanz.de',
            template='mail/email_verification',
            id=new_sub.id,
            token=new_sub.token
        )

        return schema.dump(new_sub), 201
    except IntegrityError as ex:
        print(ex)
        assert isinstance(ex.orig, UniqueViolation)  # proves the original exception
        db.session.rollback()
        sub = db.session.query(EmailSub) \
            .filter(EmailSub.verified == False, EmailSub.email_hash == request.json['email']) \
            .first()
        # resend verification
        if sub is not None:
            sub.send_email(
                subject='[CoronaVis] Verifiziere deine E-Mail-Adresse',
                sender='coronavis@dbvis.inf.uni-konstanz.de',
                template='mail/email_verification',
                id=sub.id,
                token=sub.token
            )

        return schema.dump(sub), 201


@routes.route('/<id>/<token>', methods=['GET'])
def get(id, token):
    sub = __get_and_verify(id, token)
    return email_subs_schema.dump(sub)


@routes.route('/<id>/<token>', methods=['PATCH'])
def update(id, token):
    sub = __get_and_verify(id, token)

    if 'email' in request.json:
        sub.email = request.json['email']

    if 'lang' in request.json:
        sub.lang = request.json['lang']

    if 'verified' in request.json:
        sub.verified = request.json['verified']

    counties = []
    if 'counties' in request.json:
        counties = request.json['counties']

    db.session.query(SubscribedCounties).filter_by(sub_id=id).delete()
    db.session.commit()

    for cjson in counties:
        c = SubscribedCounties()
        c.sub_id = id
        c.ags = cjson['ags']
        db.session.add(c)

    db.session.commit()
    return email_subs_schema.dump(sub)


@routes.route('/<id>/<token>', methods=['DELETE'])
def delete(id, token):
    sub = __get_and_verify(id, token)
    db.session.delete(sub)
    db.session.commit()
    return '', 200


@routes.route('/send-notifications', methods=['POST'])
def send_notifications():
    if not request.headers.get('X-API-KEY') == os.getenv('API_KEY'):
        f = Forbidden()
        f.description = 'Invalid API key'
        raise f

    __delete_unverified_emails()

    __rotate_tokens()

    c = CaseDevelopments('cases_per_county_and_day_risklayer')
    sevendaysago = (datetime.now(timezone.utc) - timedelta(days=8)).strftime('%Y-%m-%d')
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime('%Y-%m-%d')
    de = c.getCountry(fromTime=sevendaysago, toTime=tomorrow, idCountry='de')
    de_developments = de['properties']['developments']
    de_today = de_developments[-1]
    de_24h = de_developments[-2]
    de_72h = de_developments[-4]
    de_7d = de_developments[-8]

    prognosis = RisklayerPrognosis.query.order_by(RisklayerPrognosis.datenbestand.desc()).limit(1)[0]

    sql_result = db.engine.execute('''
    SELECT id, email, token, lang, c.ags, MAX(c.updated_at), 
    (CASE WHEN c.updated_at::date = e.last_email_sent::date THEN true ELSE false END) AS second_email
    FROM email_subs e
    JOIN email_subs_counties esc on e.id = esc.sub_id
    JOIN cases_lk_risklayer c ON esc.ags = c.ags
    WHERE c.updated_today = true AND c.date = now()::date
    AND c.updated_at > e.last_email_sent AND e.verified = true
    GROUP BY id, email, token, lang, c.ags, c.updated_at::date, e.last_email_sent::date
    ''')

    num_emails = 0

    for row in sql_result:
        lk = c.getCounty(fromTime=sevendaysago, toTime=tomorrow, idCounty=row['ags'])
        lk_developments = lk['properties']['developments']
        lk_today = lk_developments[-1]
        lk_24h = lk_developments[-2]
        lk_72h = lk_developments[-4]
        lk_7d = lk_developments[-8]

        desc = lk['properties']['description']
        name = lk['properties']['name']

        sub: EmailSub = EmailSub.query.get_or_404(row['id'])

        sub.send_email(
            subject=f'[CoronaVis] Neue Daten für {desc} {name}',
            sender='coronavis@dbvis.inf.uni-konstanz.de',
            template='mail/county_notification',
            sub_id=row['id'],
            token=decrypt_message(row['token'].tobytes()),
            second_email=row['second_email'],

            county_desc=desc,
            county_name=name,
            county_population=round(lk_today['population']),
            county_last_updated=lk_today['last_updated'],
            county_cases_total=lk_today['cases'],
            county_cases_total_100k=round(__100k_change(lk_today['cases'], 0, lk_today['population']), 2),
            county_cases_24=__diff_str(lk_today['cases'] - lk_24h['cases']),
            county_cases_24_prc=__diff_str(__prc_change(lk_today['cases'], lk_24h['cases'])),
            county_cases_24_100k=__diff_str(__100k_change(lk_today['cases'], lk_24h['cases'], lk_today['population'])),
            county_cases_72=__diff_str(lk_today['cases'] - lk_72h['cases']),
            county_cases_72_prc=__diff_str(__prc_change(lk_today['cases'], lk_72h['cases'])),
            county_cases_72_100k=__diff_str(__100k_change(lk_today['cases'], lk_72h['cases'], lk_today['population'])),
            county_cases_7=__diff_str(lk_today['cases'] - lk_7d['cases']),
            county_cases_7_prc=__diff_str(__prc_change(lk_today['cases'], lk_7d['cases'])),
            county_cases_7_100k=__diff_str(__100k_change(lk_today['cases'], lk_7d['cases'], lk_today['population'])),
            county_deaths_total=lk_today['deaths'],
            county_deaths_total_100k=round(__100k_change(lk_today['deaths'], 0, lk_today['population']), 2),
            county_deaths_24=__diff_str(lk_today['deaths'] - lk_24h['deaths']),
            county_deaths_24_prc=__diff_str(__prc_change(lk_today['deaths'], lk_24h['deaths'])),
            county_deaths_24_100k=__diff_str(
                __100k_change(lk_today['deaths'], lk_24h['deaths'], lk_today['population'])),
            county_deaths_72=__diff_str(lk_today['deaths'] - lk_72h['deaths']),
            county_deaths_72_prc=__diff_str(__prc_change(lk_today['deaths'], lk_72h['deaths'])),
            county_deaths_72_100k=__diff_str(
                __100k_change(lk_today['deaths'], lk_72h['deaths'], lk_today['population'])),
            county_deaths_7=__diff_str(lk_today['deaths'] - lk_7d['deaths']),
            county_deaths_7_prc=__diff_str(__prc_change(lk_today['deaths'], lk_7d['deaths'])),
            county_deaths_7_100k=__diff_str(__100k_change(lk_today['deaths'], lk_7d['deaths'], lk_today['population'])),

            num_counties_reported=de_today['num_counties_reported'],
            num_counties_total=de_today['num_counties_total'],
            prognosis=round(prognosis.prognosis),
            country_population=round(de_today['population']),
            country_last_updated=de_today['last_updated'],
            country_cases_total=de_today['cases'],
            country_cases_total_100k=round(__100k_change(de_today['cases'], 0, de_today['population']), 2),
            country_cases_24=__diff_str(de_today['cases'] - de_24h['cases']),
            country_cases_24_prc=__diff_str(__prc_change(de_today['cases'], de_24h['cases'])),
            country_cases_24_100k=__diff_str(__100k_change(de_today['cases'], de_24h['cases'], de_today['population'])),
            country_cases_72=__diff_str(de_today['cases'] - de_72h['cases']),
            country_cases_72_prc=__diff_str(__prc_change(de_today['cases'], de_72h['cases'])),
            country_cases_72_100k=__diff_str(__100k_change(de_today['cases'], de_72h['cases'], de_today['population'])),
            country_cases_7=__diff_str(de_today['cases'] - de_7d['cases']),
            country_cases_7_prc=__diff_str(__prc_change(de_today['cases'], de_7d['cases'])),
            country_cases_7_100k=__diff_str(__100k_change(de_today['cases'], de_7d['cases'], de_today['population'])),
            country_deaths_total=de_today['deaths'],
            country_deaths_total_100k=round(__100k_change(de_today['deaths'], 0, de_today['population']), 2),
            country_deaths_24=__diff_str(de_today['deaths'] - de_24h['deaths']),
            country_deaths_24_prc=__diff_str(__prc_change(de_today['deaths'], de_24h['deaths'])),
            country_deaths_24_100k=__diff_str(
                __100k_change(de_today['deaths'], de_24h['deaths'], de_today['population'])),
            country_deaths_72=__diff_str(de_today['deaths'] - de_72h['deaths']),
            country_deaths_72_prc=__diff_str(__prc_change(de_today['deaths'], de_72h['deaths'])),
            country_deaths_72_100k=__diff_str(
                __100k_change(de_today['deaths'], de_72h['deaths'], de_today['population'])),
            country_deaths_7=__diff_str(de_today['deaths'] - de_7d['deaths']),
            country_deaths_7_prc=__diff_str(__prc_change(de_today['deaths'], de_7d['deaths'])),
            country_deaths_7_100k=__diff_str(__100k_change(de_today['deaths'], de_7d['deaths'], de_today['population']))

        )

        db.session.add(sub)
        db.session.commit()
        num_emails += 1

    return f'emails sent {num_emails}', 200


def __prc_change(new, old) -> float:
    if old == 0:
        return 0
    return ((new - old) / old) * 100


def __100k_change(new, old, pop) -> float:
    return ((new - old) / pop) * 100000


def __diff_str(val) -> str:
    if val > 0:
        return '+' + str(round(val, 2))
    return str(round(val, 2))


def __get_and_verify(id, token) -> EmailSub:
    sub = EmailSub.query.get_or_404(id)
    if not sub.verify_token(token):
        b = Forbidden()
        b.description = 'invalid token'
        raise b

    return sub


def __rotate_tokens():
    since = datetime.now(timezone.utc) - timedelta(hours=72)
    subs = db.session.query(EmailSub).filter(EmailSub.token_updated < since).all()

    for s in subs:
        s.update_token()

    db.session.commit()


def __delete_unverified_emails():
    since = datetime.now(timezone.utc) - timedelta(hours=1)
    db.session.query(EmailSub).filter(EmailSub.last_email_sent < since, EmailSub.verified == False).delete()

    db.session.commit()
