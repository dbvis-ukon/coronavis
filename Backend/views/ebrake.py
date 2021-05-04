import datetime
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

    """
    from_time = '2020-01-01'
    to_time = (datetime.datetime.now() + datetime.timedelta(days=10)).isoformat()

    if request.args.get('from'):
        from_time = request.args.get('from')

    if request.args.get('to'):
        to_time = request.args.get('to')

    sql_stmt = '''
        WITH unified AS (
        SELECT ags, timestamp
        FROM rki_incidence_excel_berlin
        WHERE timestamp >= :fromtime
        AND timestamp <= :totime

        UNION DISTINCT
        SELECT id, timestamp
        FROM counties_ebrake
        WHERE timestamp >= :fromtime
        AND timestamp <= :totime
     ),

     rki_data AS (
        SELECT *
        FROM rki_incidence_excel_berlin r1
        WHERE r1.datenbestand = (SELECT MAX(datenbestand) FROM rki_incidence_excel_berlin)
        AND r1.timestamp >= :fromtime
        AND r1.timestamp <= :totime
    ),

    ebrake_data AS (
        SELECT *
        FROM counties_ebrake e
        WHERE e.timestamp >= :fromtime
        AND e.timestamp <= :totime
    )


        SELECT
            r.datenbestand,
            r.updated_at,
            coalesce(e.id, r.ags),
            COALESCE(e.timestamp, r.timestamp),
            r."7_day_incidence",
            r."7_day_cases",
            e.ebrake100,
            e.ebrake165,
            (le.bez || ' ' || le.name) as le_name,
            e.ebrake150,
            e.holiday
        FROM unified AS u
        JOIN landkreise_extended le ON u.ags = le.ids
        LEFT OUTER JOIN rki_data AS r ON u.timestamp = r.timestamp AND u.ags = r.ags
        LEFT OUTER JOIN ebrake_data AS e ON u.timestamp = e.timestamp AND u.ags = e.id
        ORDER BY le.ids, coalesce(e.timestamp, r.timestamp)
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
