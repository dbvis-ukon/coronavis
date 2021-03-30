import hashlib
import json

from flask import Blueprint, request, jsonify

from db import db
from models.dashboard import Dashboard

routes = Blueprint('dashboards', __name__, url_prefix='/dashboards')


@routes.route('/', methods=['POST'])
def new_dashboard():
    if not request.json['title'] or not request.json['items']:
        return 'bad request', 401

    sanitized = {
        'title': request.json['title'],
        'items': []
    }

    for i in request.json['items']:
        sitem = {
            'type': i['type']
        }

        print(i)
        for t in ['text', 'config', 'dataRequest']:
            print(t)
            if t in i:
                sitem[t] = i[t]

        sanitized['items'].append(sitem)

    json_str = json.dumps(sanitized, separators=(',', ':'))
    hashed = hashlib.md5(json_str.encode()).hexdigest()

    print(json_str)
    print(hashed)

    db_dashboard = Dashboard.query.get(hashed)

    if db_dashboard:
        db_dashboard.dashboard = sanitized
        db.session.commit()
        return _get_and_prepare(hashed)
    else:
        dashboard_new = Dashboard(
            id=hashed,
            dashboard=sanitized
        )
        db.session.add(dashboard_new)
        db.session.flush()
        db.session.commit()
        return _get_and_prepare(hashed)


@routes.route('/<id_db>', methods=['GET'])
def get(id_db):
    return _get_and_prepare(id_db, up_visit=True)


@routes.route('/<id_db>/upvote', methods=['POST'])
def upvote(id_db):
    return _get_and_prepare(id_db, up_visit=False, up_vote=True)


@routes.route('/newest', methods=['GET'])
def get_newest():
    return _prepare_all(Dashboard.query.order_by(Dashboard.created_at.desc()).limit(10).all())


@routes.route('/most-visited', methods=['GET'])
def get_most_visited():
    # noinspection PyUnresolvedReferences
    return _prepare_all(Dashboard.query.order_by(Dashboard.visits.desc()).limit(10).all())


@routes.route('/most-upvoted', methods=['GET'])
def get_most_upvoted():
    # noinspection PyUnresolvedReferences
    return _prepare_all(Dashboard.query.order_by(Dashboard.upvotes.desc()).limit(10).all())


def _get_and_prepare(id_db: str, up_visit=False, up_vote=False) -> dir:
    ds = Dashboard.query.get_or_404(id_db)
    if up_visit or up_vote:
        if up_visit:
            ds.visits += 1
        if up_vote:
            ds.upvotes += 1
        db.session.commit()
    return _prepare(ds)


def _prepare(dashboard: Dashboard) -> dir:
    sanitized = dashboard.dashboard
    sanitized['id'] = dashboard.id
    sanitized['visits'] = dashboard.visits
    sanitized['upvotes'] = dashboard.upvotes
    sanitized['created_at'] = dashboard.created_at.isoformat()
    return sanitized


def _prepare_all(dashboards):
    ret = []
    for ds in dashboards:
        ret.append(_prepare(ds))
    return jsonify(ret)
