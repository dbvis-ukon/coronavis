FROM nginx:alpine

RUN apk add --update curl

COPY ./mysite.conf /etc/nginx/conf.d/default.conf

# test config syntax and debug
RUN nginx -T

COPY ./gis/dist /usr/share/nginx/html/

RUN ls -la /usr/share/nginx/html/
