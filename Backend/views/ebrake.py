from decimal import Decimal

from flask import Blueprint

from cache import cache
from db import db
from timer import timer

routes = Blueprint('ebrake', __name__, url_prefix='/federal-emergency-brake')


@routes.route('/', methods=['GET'])
@timer
@cache.cached()
def get_rki_emergency_brake():
    """ Returns the incidences and corresponding emergency brake information based on rki.de/inzidenzen
    The calculation whether a county is in federal-emergency-brake is performed here: https://github.com/dbvis-ukon/coronavis/blob/master/Crawler/crawl_rki_incidences.py#L141
    ---
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
    sql_stmt = '''
        WITH rki_data AS (
        SELECT *
        FROM rki_incidence_excel r1
        WHERE r1.datenbestand = (SELECT MAX(datenbestand) FROM rki_incidence_excel))
        
        SELECT r.datenbestand, r.updated_at, r.ags, r.timestamp, r."7_day_incidence", r."7_day_cases", e.ebrake100, e.ebrake165
        FROM rki_data AS r
        LEFT OUTER JOIN counties_ebrake AS e ON r.timestamp = e.timestamp AND r.ags = e.id
        ORDER BY r.ags, r.timestamp 
    '''
    res = db.engine.execute(sql_stmt).fetchall()

    entries = []
    for d in res:
        entries.append({
            'id': d[2],
            'timestamp': d[3].isoformat(),
            '7_day_incidence': float(d[4]) if isinstance(d[4], Decimal) else None,
            '7_day_cases': int(d[5]) if isinstance(d[4], Decimal) else None,
            'ebrake100': d[6],
            'ebrake165': d[7]
        })

    return {
        'last_updated': res[0][0].isoformat(),
        'last_checked': res[0][1].isoformat(),
        'data': entries
    }, 200
