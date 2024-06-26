import os

from flask import Blueprint, jsonify, request, send_file, current_app

from cache import cache, make_cache_key
from db import db
from models.caseDevelopments import CaseDevelopments
from timer import timer

routes = Blueprint('cases-risklayer', __name__, url_prefix='/cases-risklayer')

cd = CaseDevelopments('cases_per_county_and_day_risklayer')


def get_latest_xlsx(rkfolder) -> str:
    _, _, filenames = next(os.walk(rkfolder))
    filtered = list(filter(lambda x: os.stat(rkfolder + '/' + x).st_size > 1000000 and x.endswith('xlsx'), filenames))
    filtered.sort(reverse=True)
    return filtered[0]


@routes.route('/development/landkreise', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_counties():
    return cd.get_by_counties(request.args.get('from'), request.args.get('to'), False,
                              request.args.get('nogeom', type=bool) != True
                              )


@routes.route('/development/regierungsbezirke', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_districts():
    return cd.get_by_districts(request.args.get('from'), request.args.get('to'), False,
                               request.args.get('nogeom', type=bool) != True
                               )


@routes.route('/development/bundeslaender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_states():
    return cd.get_by_states(request.args.get('from'), request.args.get('to'), False,
                            request.args.get('nogeom', type=bool) != True
                            )


@routes.route('/development/laender', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_cases_development_by_countries():
    return cd.get_by_countries(request.args.get('from'), request.args.get('to'), False,
                               request.args.get('nogeom', type=bool) != True
                               )


@routes.route('/development/landkreis/<id_county>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_county(id_county):
    return cd.get_county(request.args.get('from'), request.args.get('to'), id_county, False,
                         request.args.get('nogeom', type=bool) != True
                         )


@routes.route('/development/regierungsbezirk/<id_district>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_district(id_district):
    return cd.get_district(request.args.get('from'), request.args.get('to'), id_district, False,
                           request.args.get('nogeom', type=bool) != True
                           )


@routes.route('/development/bundesland/<id_state>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_state(id_state):
    return cd.get_state(request.args.get('from'), request.args.get('to'), id_state, False,
                        request.args.get('nogeom', type=bool) != True
                        )


@routes.route('/development/land/<id_country>', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_country(id_country):
    return cd.get_country(request.args.get('from'), request.args.get('to'), id_country, False,
                          request.args.get('nogeom', type=bool) != True
                          )


@routes.route('/development/aggregated', methods=['GET'])
@cache.cached(key_prefix=make_cache_key)
@timer
def get_aggregated():
    return cd.get_aggregated({
        'landkreise': request.args.get('landkreise'),
        'regierungsbezirke': request.args.get('regierungsbezirke'),
        'bundeslaender': request.args.get('bundeslaender'),
        'laender': request.args.get('laender')
    },
        request.args.get('from'),
        request.args.get('to'),
        False,
        request.args.get('nogeom', type=bool) != True
    )


@routes.route('/prognosis', methods=['GET'])
@cache.cached()
def get_prognosis():
    """
        Returns the prognosis of Risklayer
    """

    sql_stmt = '''
        SELECT * 
        FROM risklayer_prognosis
        WHERE datenbestand = (
            SELECT MAX(datenbestand) FROM risklayer_prognosis
        )
    '''
    res = db.engine.execute(sql_stmt).fetchone()

    ret = {
        "timestamp": res[0],
        "prognosis": res[1]
    }

    return jsonify(ret), 200


@routes.route('/xlsx-last-update', methods=['GET'])
@cache.cached()
def latest_xlsx():
    """Returns the last update of the risklayer spreadsheet
    The spreadsheet is updated every 30 minutes at xx:00 and xx:30.
    ---
    responses:
      200:
        description: A JSON object with a key last_update and a UTC timestamp
        schema:
          type: object
          properties:
            last_update:
              type: string
              example: 2021-04-19T20-05-33Z
    """
    rkfolder = current_app.root_path + '/data-risklayer'
    return {'last_update': get_latest_xlsx(rkfolder)[0:-5] + 'Z'}


@routes.route('/xlsx', methods=['GET', 'POST'])
def download_xlsx():
    """Returns the latest spreadsheet as a .xlsx file
    The sheet is not modified and generated via the google export to .xlsx function.
    The spreadsheet is updated every 30 minutes at xx:00 and xx:30.
    ---
    responses:
      200:
        description: A .xlsx file of the latest risklayer spreadsheet
    """
    rkfolder = current_app.root_path + '/data-risklayer'
    filtered = get_latest_xlsx(rkfolder)
    return send_file(path_or_file=rkfolder + '/' + filtered,
                     attachment_filename='risklayer-' + filtered,
                     as_attachment=True,
                     cache_timeout=60,
                     mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
