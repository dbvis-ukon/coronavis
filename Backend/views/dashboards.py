import hashlib
import json
from datetime import datetime

from flask import Blueprint, request, jsonify
from sqlalchemy import text
from tzlocal import get_localzone

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
            dashboard=sanitized,
            parent_id=request.json['id'] or None,
            created_at=datetime.now(tz=get_localzone())
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


@routes.route('/<id_db>/history', methods=['GET'])
def get_ancestors(id_db):
    current_dashboard = Dashboard.query.get(id_db)

    if current_dashboard is None:
        current_dashboard = Dashboard(
            id=id_db,
            dashboard={},
            current=True
        )

    q = db.session.query(Dashboard).from_statement(
        text("""
        WITH RECURSIVE supplytree AS
        (
            SELECT id, parent_id, id::text As si_item_fullname
            FROM dashboards
            WHERE dashboards.id = :n
        UNION ALL
            SELECT si.id,
            si.parent_id,
            (sp.si_item_fullname || '->' || si.id::text)::text As si_item_fullname
            FROM dashboards As si
            INNER JOIN supplytree AS sp
            ON (si.id = sp.parent_id)
        )
        SELECT supplytree.parent_id AS id,
        d.dashboard,
        d.upvotes,
        d.visits,
        d.created_at
        FROM supplytree
        JOIN dashboards d ON supplytree.parent_id = d.id
        ORDER BY si_item_fullname DESC;
        """)).params(n=id_db)
    all_dashboards: list[Dashboard] = q.all()
    if len(all_dashboards) > 0 and all_dashboards[0].parent_id is not None:
        all_dashboards.insert(0, Dashboard(
            id=all_dashboards[0].parent_id,
            dashboard={}
        ))

    current_dashboard.current = True

    all_dashboards.append(current_dashboard)

    # if this is a dashboard that comes right after AGS dashboard
    if len(all_dashboards) > 0 and all_dashboards[0].parent_id is not None:
        all_dashboards.insert(0, Dashboard(
            id=all_dashboards[0].parent_id,
            dashboard={}
        ))

    children_query = db.session.query(Dashboard).from_statement(
        text("""
        WITH RECURSIVE supplytree AS
            (SELECT id, parent_id, id::text As si_item_fullname
            FROM dashboards
            WHERE dashboards.parent_id = :n
        UNION ALL
            SELECT si.id,
                si.parent_id,
                (sp.si_item_fullname || '->' || si.id::text)::text As si_item_fullname
            FROM dashboards As si
                INNER JOIN supplytree AS sp
                ON (si.parent_id = sp.id)
        )
        SELECT d.*
        FROM supplytree
        JOIN dashboards d ON supplytree.id = d.id
        ORDER BY si_item_fullname;
            """)).params(n=id_db)

    children: list[Dashboard] = children_query.all()

    return _prepare_all(all_dashboards + children)


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
    if dashboard.created_at is not None:
        sanitized['created_at'] = dashboard.created_at.isoformat()
    sanitized['parent_id'] = dashboard.parent_id
    if dashboard.current:
        sanitized['current'] = True
    return sanitized


def _prepare_all(dashboards):
    ret = []
    for ds in dashboards:
        ret.append(_prepare(ds))
    return jsonify(ret)
