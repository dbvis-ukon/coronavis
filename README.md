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
- [Postgresql](https://www.postgresql.org/) v12 with [PostGIS](https://postgis.net/) extension

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

## Contact

You can get in contact with us by writing an issue, via [twitter (@dbvis)](https://twitter.com/dbvis), or email at support[at]dbvis.inf.uni-konstanz.de.