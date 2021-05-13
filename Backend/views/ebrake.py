import datetime
import re
from decimal import Decimal

from flask import Blueprint, request
from sqlalchemy import text

from cache import cache, make_cache_key
from db import db
from timer import timer

routes = Blueprint('ebrake', __name__, url_prefix='/federal-emergency-brake')


@routes.route('/', methods=['GET'])
@timer
@cache.cached(key_prefix=make_cache_key)
def get_rki_emergency_brake():
    """ Returns the incidences and corresponding emergency brake information based on rki.de/inzidenzen
    The calculation whether a county is in federal-emergency-brake is performed here: https://github.com/dbvis-ukon/coronavis/blob/master/Crawler/crawl_rki_incidences.py#L141
    ---
    parameters:
      - name: from
        type: string
        description: A date in ISO format
        required: false
        default: 2020-01-01
        example: 2021-04-20
      - name: to
        type: string
        description: A date in ISO format
        required: false
        example: 2021-05-20
      - name: ids
        type: string[]
        description: ids (AGS) of the regions, comma separated
        required: false
        example: 08335,08336
    responses:
      200:
        description:
        schema:
          type: object
          properties:
            last_updated:
              type: string
              example: 2021-04-25T08:39:47
            last_checked:
              type: string
              example: 2021-04-26T02:28:39.523499+02:00
            data:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                    example: 08335
                    description: The AGS of the county
                  name:
                    type: string
                    example: Landkreis Konstanz
                    description: The name of the county
                  timestamp:
                    type: string
                    example: 2021-04-25T00:00:00
                    description: The reference date
                  7_day_incidence:
                    type: number
                    format: float
                    example: 152.2851504514
                    description: The 7 day incidence based on the excel sheet
                  7_day_cases:
                    type: number
                    format: int
                    example: 436
                    description: The 7 day cases based on the excel sheet
                  ebrake100:
                    type: boolean
                    example: true
                    description: true iff the county is currently in the ebrake(100), false otherwise; may be null
                  ebrake165:
                    type: boolean
                    example: true
                    description: true iff the county is currently in the ebrake(165), false otherwise; may be null
                  holiday:
                    type: string
                    example: Erster Mai
                    description: The name of the holiday (German) or null iff no holiday

    """
    from_time = '2020-01-01'
    to_time = (datetime.datetime.now() + datetime.timedelta(days=10)).isoformat()

    if request.args.get('from'):
        from_time = request.args.get('from')

    if request.args.get('to'):
        to_time = request.args.get('to')

    sql_ids = ''
    if request.args.get('ids'):
        ids = request.args.get('ids').split(',')
        sanitized_sql = []
        for id in ids:
            id = re.sub('[^0-9]+', '', id)
            sanitized_sql.append(f"(id LIKE '{id}%')")

        sql_ids = f"AND ({' OR '.join(sanitized_sql)})"


    sql_stmt = f'''
        SELECT
            e.datenbestand,
            e.updated_at,
            e.id,
            e.timestamp,
            e."7_day_incidence",
            e."7_day_cases",
            e.ebrake100,
            e.ebrake165,
            (le.bez || ' ' || le.name) as le_name,
            e.ebrake150,
            e.holiday
        FROM ebrake_data e
        JOIN landkreise_extended le ON e.id = le.ids
        WHERE e.timestamp >= :fromtime
        AND e.timestamp <= :totime
        {sql_ids}
    '''
    res = db.engine.execute(text(sql_stmt), fromtime=from_time, totime=to_time).fetchall()

    entries = []
    for d in res:
        entries.append({
            'id': d[2],
            'timestamp': d[3].isoformat(),
            'holiday': d[10],
            '7_day_incidence': float(d[4]) if isinstance(d[4], Decimal) else None,
            '7_day_cases': int(d[5]) if isinstance(d[4], Decimal) else None,
            'ebrake100': d[6],
            'ebrake150': d[9],
            'ebrake165': d[7],
            'name': d[8]
        })

    return {
        'last_updated': res[0][0].isoformat(),
        'last_checked': res[0][1].isoformat(),
        'data': entries
    }, 200
