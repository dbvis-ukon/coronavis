![image](./Frontend/gis/src/assets/coronavislogo300.png)

This is a volunteer project by members of the [Data Analysis and Visualization Group](http://vis.uni.kn) and the [Visual Computing Group](https://www.cgmi.uni-konstanz.de/en/) at the [University of Konstanz](http://uni.kn).

The live version is available at [https://coronavis.dbvis.de](https://coronavis.dbvis.de).

CoronaVis visualizes intensive care unit (ICU) bed capacities of German hospitals (provided by [DIVI](https://divi.de)) as well as data from the COVID-19 pandemic (provided by [Robert Koch Institut](https://rki.de)).

## Technologies / Frameworks used

Frontend:
- [Angular](https://angular.io)
- [Angular Material](https://material.angular.io)
- [leaflet](https://leafletjs.com/)
- [Vega](https://vega.github.io/)
- [d3](https://d3js.org)

For more have a look at the [package.json](./Frontend/gis/package.json)

Backend:
- [python-flask](https://flask.palletsprojects.com/en/1.1.x/)
- [sql alchemy](https://www.sqlalchemy.org/)

For more have a look at the [requirements.txt](./Backend/requirements.txt)

Database:
- [Postgresql](https://www.postgresql.org/) v13 with [PostGIS](https://postgis.net/) extension

Tileserver:
- self-hosted tileserver based on [nginx](https://nginx.com)
- tiles created with [QGis](https://www.qgis.org/en/site/)

Hosting:
- everything is hosted in a [kubernetes](https://kubernetes.io) cluster created by the DBVIS group

## Contributions

Contributions are welcome! 
Please note that we access publicly available data.
If a country or region you know is providing similar data please let us know.
We are constantly seeking to expand our map and add more countries.

### Local Development

1. Initial: Install docker and docker-compose on your system (Note: for Windows & Mac, docker-compose is already shipped with Docker Desktop).

2. Initial: First `cp .env.example .env` and fill out the values. See the comments of the `.env` file.

3. Start a separate terminal and run `docker-compose up db frontend backend` to start all the services. The database will be automatically populated with the tables, however, no data will be available initially. Leave this terminal open, you can check here for any log messages.

4. Make sure that in the file `./Frontend/gis/src/environments/environment.ts` the `apiUrl` is set to `apiUrl: 'http://localhost:5000/'`.

5. Open your browser with URL `localhost:4200` to see the frontend. You can test API calls at `localhost:5000/...`.

6. When you update any file in the frontend or backend code, the servers will restart and reload automatically.

7. To run any crawler and add data into your database run `docker-compose run crawler python crawl_risklayer_lk.py`, `docker-compose run crawler python crawl_rki_cases.py`, `docker-compose run crawler python crawl_divi_public.py`. These crawlers run periodically in our production system.

8. To shut down you local development environment head back to the terminal of step 3 and press `Ctrl+C`.

To restart your local development environment start with step 3.


#### Troubleshooting

Some general commands you can try:

- stop all running containers with `Ctrl+C` and run `docker-compose down` which will delete all containers (no data will be deleted). Run `docker-compose up db frontend backend` again and check if your problem has been resolved.

- `docker-compose build --no-cache` to rebuild all images and run `docker-compose up db frontend backend` again.

- **!!!WARNING THIS STEP WILL DELETE YOUR DATABASE!!!** `docker-compose down --volumes` and then run `docker-compose up db frontend backend`

## Contact

You can get in contact with us by writing an issue, via [twitter (@dbvis)](https://twitter.com/dbvis), or email at support[at]dbvis.inf.uni-konstanz.de.
