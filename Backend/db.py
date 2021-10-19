from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy(engine_options={"pool_size": 5, "max_overflow": 20})
""":type: sqlalchemy.orm.Session"""
