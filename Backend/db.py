from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy(engine_options={"pool_size": 10, "max_overflow": 50})
""":type: sqlalchemy.orm.Session"""
