FROM nginx:alpine

ARG VERSION='development'

# install sed and pigz without caching them
RUN apk add --no-cache sed pigz

# Copy nginx configuration to docker container
COPY ./mysite.conf /etc/nginx/conf.d/default.conf

# replace the %VERSION% string with the $VERSION provided by the argument which is either a commit sha or tag
RUN sed -i "s/%VERSION%/$VERSION/" /etc/nginx/conf.d/default.conf

# Check the syntax of the config and dump it
RUN nginx -T

# Copy and extract tileset to nginx web dir
COPY ./covid19_tiles_germany_2-11_DBVIS.tar.gz /tmp/

# unpack the tiles with with multiple cores
RUN pigz -dc /tmp/covid19_tiles_germany_2-11_DBVIS.tar.gz | tar -x -C /usr/share/nginx/html/

# remove archive to reduce image size
RUN rm /tmp/covid19_tiles_germany_2-11_DBVIS.tar.gz

# Check if files are correctly placed in nginx web dir
RUN ls -la /usr/share/nginx/html/
