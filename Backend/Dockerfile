# Declare which image to pull
# We use a minimal system with Python 3.7 installed
FROM python:3.14-slim

# Set working directory location
ENV APP_DIR=/var/opt/gis

RUN mkdir /prometheus-data
ENV prometheus_multiproc_dir=/prometheus-data

# requirements first to use build caching
COPY ./requirements.txt ${APP_DIR}/requirements.txt

WORKDIR ${APP_DIR}
RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

# copy application code
COPY . ${APP_DIR}

# set environment variables
ENV FLASK_DEBUG 1
ENV FLASK_RUN_HOST 0.0.0.0
ENV FLASK_ENV development
ENV FLASK_APP server.py

RUN chmod +x migrate-and-start.sh

# start container
CMD ./migrate-and-start.sh