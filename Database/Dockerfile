# Declare which image to pull
# We use a prebuilt PostgreSQL Database with the GIS Extension already installed
FROM kartoza/postgis:11.0-2.5

# Set default credentials and database
ENV POSTGRES_USER gis_user
ENV POSTGRES_PASSWORD gis_pass
ENV POSTGRES_DB gis

# Update apt-get cache and install the OpenStreetMap Importer
RUN apt-get update
RUN apt-get install -y osm2pgsql

# Copy data from local filesystem into docker container.
# Import_dataset is the importer script for the OSM data 
# and docker-entrypoint.sh overrides the default startup script.
COPY baden-wuerttemberg-latest.osm.pbf /importdata/baden-wuerttemberg-latest.osm.pbf
COPY import_dataset.sh /docker-entrypoint-initdb.d/import_dataset.sh
COPY docker-entrypoint.sh /docker-entrypoint.sh
