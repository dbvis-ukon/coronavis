FROM nginx:alpine

# https://github.com/GoogleContainerTools/kaniko/issues/1278#issuecomment-693459315
RUN test -e /var/run || ln -s /run /var/run

RUN apk add --update curl

COPY ./mysite.conf /etc/nginx/conf.d/default.conf

# test config syntax and debug
RUN nginx -T

COPY ./gis/dist /usr/share/nginx/html/

RUN ls -la /usr/share/nginx/html/
