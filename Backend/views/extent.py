from flask import Blueprint, jsonify

from cache import cache
from db import db
from timer import timer

routes = Blueprint('extent', __name__, url_prefix='/extent')


@routes.route('/', methods=['GET'])
@timer
@cache.cached()
def get_extent():
    """
        Returns the extent of our data
    """

    sql_stmt = '''
        WITH allt AS (
            SELECT
            MIN(timestamp) as mint,
            MAX(timestamp) as maxt
            FROM filled_hospital_timeseries_with_fix

            UNION

            SELECT
                MIN(timestamp) as mint,
                MAX(timestamp) as maxt
            FROM cases_per_county_and_day

            UNION

            SELECT
                MIN(timestamp) as mint,
                MAX(timestamp) as maxt
            FROM cases_per_county_and_day_risklayer
        )
        SELECT 
        to_char(MIN(mint), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as mint, to_char(MAX(maxt), 'YYYY-MM-DD"T"HH24:MI:SSZ') 
            AS maxt 
        FROM allt
    '''
    res = db.engine.execute(sql_stmt).fetchone()

    return jsonify([res[0], res[1]]), 200
