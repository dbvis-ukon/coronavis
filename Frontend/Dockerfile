FROM nginx:alpine

RUN apk add --update curl

COPY ./mysite.conf /etc/nginx/conf.d/default.conf

COPY ./gis/dist/* /usr/share/nginx/html/

RUN ls -la /usr/share/nginx/html/
