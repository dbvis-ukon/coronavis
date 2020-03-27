FROM nginx:alpine

ARG VERSION='development'

RUN apk add --no-cache sed

# Copy nginx configuration to docker container
COPY ./mysite.conf /etc/nginx/conf.d/default.conf

RUN sed -i "s/%VERSION%/$VERSION/" /etc/nginx/conf.d/default.conf

RUN cat /etc/nginx/conf.d/default.conf

# Copy and extract tileset to nginx web dir
COPY ./covid19_tiles_world_1-10.tar.gz /tmp/
RUN apk add pigz
RUN pigz -dc /tmp/covid19_tiles_world_1-10.tar.gz | tar -x -C /usr/share/nginx/html/
RUN rm /tmp/covid19_tiles_world_1-10.tar.gz

# Check if files are correctly placed in nginx web dir
RUN ls -la /usr/share/nginx/html/
