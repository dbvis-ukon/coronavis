FROM bitnami/postgresql:14.15.0-debian-12-r3

USER root

# part taken from: https://github.com/postgis/docker-postgis/blob/master/13-3.0/Dockerfile

ARG PG_MAJOR=11
ARG POSTGIS_MAJOR=2.5
ARG POSTGIS_VERSION=2.5.1+dfsg-1

# RUN echo "deb http://deb.debian.org/debian sid main" >> /etc/apt/sources.list

# RUN apt update && apt install -y libc6

RUN apt-get update \
      && apt-cache showpkg postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR \
      && apt-get install -y --no-install-recommends \
           postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR=$POSTGIS_VERSION \
           postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR-scripts=$POSTGIS_VERSION \
           nano \
      && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /docker-entrypoint-initdb.d

COPY ./initdb /docker-entrypoint-initdb.d

RUN chmod +x /docker-entrypoint-initdb.d/*.sh

COPY ./update-postgis.sh /usr/local/bin