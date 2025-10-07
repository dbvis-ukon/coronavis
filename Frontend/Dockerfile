FROM nginx:alpine

RUN apk add --update curl

COPY ./mysite.conf /etc/nginx/conf.d/default.conf

# https://github.com/GoogleContainerTools/kaniko/issues/1278#issuecomment-693459315
RUN test -e /var/run || ln -s /run /var/run

RUN ls -la /var/run

# test config syntax and debug
RUN nginx -T

COPY ./gis/dist/browser /usr/share/nginx/html/

RUN ls -la /usr/share/nginx/html/
