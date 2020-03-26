#!/bin/bash

set -e

echo "Replace apiUrl with ${FRONTEND_URL_BACKEND}"

sed -i -E "s#apiUrl\s*?:\s*?['\"].+?['\"]#apiUrl: '//${FRONTEND_URL_BACKEND}/'#g" ./src/environments/environment.prod.ts

echo "Replace tile server url with ${FRONTEND_URL_TILES}"

sed -i -E "s#tileServerUrl\s*?:\s*?['\"].+?['\"]#tileServerUrl: '//${FRONTEND_URL_TILES}/'#g" ./src/environments/environment.prod.ts

echo "Modified environment.prod.ts:"

cat ./src/environments/environment.prod.ts
