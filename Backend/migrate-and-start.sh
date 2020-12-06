#!/usr/bin/env bash

set -e

echo -e "##########################\n\n\nWaiting for database to be up\n\n\n##########################"

# wait for the database
python wait_db_rdy.py

echo -e "##########################\n\n\nRunning migrations\n\n\n##########################"
cd migrations
alembic upgrade head

echo -e "##########################\n\n\nMigrations successful\n\n\n##########################"
echo -e "##########################\n\n\nStarting backend server\n\n\n##########################"

cd ..
gunicorn --config=gunicorn.conf.py server:app
