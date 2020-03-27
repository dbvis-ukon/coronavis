#!/bin/bash

set -e

ENV_FILE=./gis/src/environments/environment.prod.ts


echo "Replace apiUrl with ${FRONTEND_URL_BACKEND}"

sed -i -E "s#apiUrl\s*?:\s*?['\"].+?['\"]#apiUrl: '${URL_PROTOCOL}://${FRONTEND_URL_BACKEND}/'#g" ${ENV_FILE}

echo "Replace tile server url with ${FRONTEND_URL_TILES}"

sed -i -E "s#tileServerUrl\s*?:\s*?['\"].+?['\"]#tileServerUrl: '${URL_PROTOCOL}://${FRONTEND_URL_TILES}/'#g" ${ENV_FILE}

echo "Modified environment.prod.ts:"

cat ${ENV_FILE}
