#!/usr/bin/env bash

# Source: https://github.com/postgis/docker-postgis/blob/master/13-3.0/initdb-postgis.sh

set -e

# if this is set, the admin user is "postgres"
if [ ! -z $POSTGRESQL_POSTGRES_PASSWORD ]; then
    PGUSER="postgres"
else # else the admin user is custom
    PGUSER=$POSTGRESQL_USERNAME
fi

# Execute sql script, passed via stdin (or -f flag of pqsl)
# usage: docker_process_sql [psql-cli-args]
#    ie: docker_process_sql --dbname=mydb <<<'INSERT ...'
#    ie: docker_process_sql -f my-file.sql
#    ie: docker_process_sql <my-file.sql
docker_process_sql() {
	local query_runner=( psql -v ON_ERROR_STOP=1 --username "${PGUSER}" --no-password )
	if [ -n "$POSTGRESQL_DATABASE" ]; then
		query_runner+=( --dbname "$POSTGRESQL_DATABASE" )
	fi

	"${query_runner[@]}" "$@"
}

psql=( docker_process_sql )

# Perform all actions as $POSTGRES_USER
export PGUSER="$PGUSER"

# Create the 'template_postgis' template db
"${psql[@]}" <<- 'EOSQL'
CREATE DATABASE template_postgis IS_TEMPLATE true;
EOSQL

# Load PostGIS into both template_database and $POSTGRES_DB
for DB in template_postgis "$POSTGRESQL_DATABASE"; do
	echo "Loading PostGIS extensions into $DB"
	"${psql[@]}" --dbname="$DB" <<- 'EOSQL'
		CREATE EXTENSION IF NOT EXISTS postgis;
		CREATE EXTENSION IF NOT EXISTS postgis_topology;
		CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
		CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
EOSQL
done