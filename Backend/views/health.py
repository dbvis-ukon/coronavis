from flask import Blueprint

routes = Blueprint('health', __name__, url_prefix='/health')

@routes.route('/')
def healthcheck():
    # FIXME: the database connection should be checked here!
    return "ok", 200