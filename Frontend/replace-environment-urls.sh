#!/bin/bash

set -e

ENV_FILE=./gis/src/environments/environment.prod.ts


echo "Replace apiUrl with ${FRONTEND_URL_BACKEND}"

sed -i -E "s#apiUrl\s*?:\s*?['\"].+?['\"]#apiUrl: '${URL_PROTOCOL}://${FRONTEND_URL_BACKEND}/'#g" ${ENV_FILE}

echo "Replace tile server url with ${FRONTEND_URL_TILES}"

sed -i -E "s#tileServerUrl\s*?:\s*?['\"].+?['\"]#tileServerUrl: '${URL_PROTOCOL}://${FRONTEND_URL_TILES}/'#g" ${ENV_FILE}

echo "Set version ${VERSION}"

sed -i -E "s#version\s*?:\s*?['\"].*?['\"]#version: '${VERSION}'#g" ${ENV_FILE}

echo "Set environment ${ENV_TYPE}"

sed -i -E "s#env\s*?:\s*?['\"].*?['\"]#env: '${ENV_TYPE}'#g" ${ENV_FILE}

echo "Modified environment.prod.ts:"

cat ${ENV_FILE}
