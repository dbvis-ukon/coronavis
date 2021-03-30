from flask import Blueprint, jsonify

from cache import cache
from db import db
from timer import timer

routes = Blueprint('regions', __name__, url_prefix='/regions')


@routes.route('/', methods=['GET'])
@timer
@cache.cached()
def get_regions():
    """
        Returns the extent of our data
    """

    sql_stmt = '''
        SELECT
            'landkreise' AS "aggLevel",
            ids AS id,
            name, 
            bez AS description
        FROM landkreise_extended
        
        UNION 
        
        SELECT 
            'regierungsbezirke' AS "aggLevel",
            ids AS id,
            name,
            'RB' AS description
        FROM regierungsbezirke
        
        UNION 
        
        SELECT
            'bundeslaender' AS "aggLevel",
            ids AS id,
            name,
            'BL' AS description
        FROM bundeslaender
        
        UNION 
        
        SELECT
            'laender' AS "aggLevel",
            ids AS id,
            name,
            '' AS description
        FROM germany
    '''
    res = db.engine.execute(sql_stmt).fetchall()

    ret = []

    for r in res:
        ret.append({
            "aggLevel": r[0],
            "id": r[1],
            "name": r[2],
            "description": r[3]
        })

    return jsonify(ret), 200
