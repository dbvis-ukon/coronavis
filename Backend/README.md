## How to backend
------

_Please read this doument for a pratical guide how to add something to the backend_

The technologies used are `Flask` and `flask_sqlalchemy` to access the database.

------
#### How should the app work

The database consists of mulitple tables:
* `crawl` : to store the raw crawled data as html and a json object with a timestamp
* `hospital` : stores hospital related data with geolocation
* `person` : contact person in the hospital
* `bed` : Bed type and description
* `hospital_beds` : resolves the many-to-many relationship with the beds. This stores the avaiable beds types (later maybe number of beds) with a timestamp.

To store the data in the database please create a post interface `api.py` which stores the raw crawled data in the data model `Crawl` (see `model.py`).
The raw data should then be internally parsed and stored via `flask_sqlalchemy` in the database.

------
#### How to extend the database model and the API

If you want to modify the database model please adapt the `model.py` file by either creating variable for the base classes and functions editing or accessing data.
The individual variables have to be also added manually then to the database.

You can add interfaces to the API in the `api.py`. Please add a route to the blueprint and then use `flask_sqlalchemy` to access or to modify the dataset.
If you want to use just SQL statements you can use the following example:

```python
@backend_api.route('/hospital/<int:id>', methods=['GET'])
def example_stmt(id=None):
        sql_stmt = '''SELECT *
                    FROM hospital
                    WHERE id = :id
                    ORDER BY "name") ; '''
        sql_result = db.engine.execute(text(stmt), id=id).fetchall()

        # do stuff here

        return jsonify(result)
```

The `create_session()` in the `db.py` can be used if you plan to do multiprocessing with `flask_sqlalchemy` as a new process requires new sessions to the database.

------
#### Why SQLAlchemy and flask_sqlalchemy

SQLAlchemy is an ORM and manages connection, driver abstraction, SQL expressions, session management, synchronization, eager loading etc.
Security is also important - as the library prevents SQL injections. For more see - [Key Features of SQLAlchemy](https://www.sqlalchemy.org/features.html)

`flask_sqlalchemy` on the other hand allows to access all the functions from `sqlalchemy` and `sqlalchemy.orm`and allows to use preconfigured sessions, engine etc.
It salso kills the sessions if the flask app is stopped.
For more see - [Flask-SQLAlchemy Quickstart](https://flask-sqlalchemy.palletsprojects.com/en/2.x/quickstart/)