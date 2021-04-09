FROM nginx:alpine

ARG VERSION='development'

# install sed and pigz without caching them
RUN apk add --no-cache sed pigz

# Copy nginx configuration to docker container
COPY ./mysite.conf /etc/nginx/conf.d/default.conf

# replace the %VERSION% string with the $VERSION provided by the argument which is either a commit sha or tag
RUN sed -i "s/%VERSION%/$VERSION/" /etc/nginx/conf.d/default.conf

# https://github.com/GoogleContainerTools/kaniko/issues/1278#issuecomment-693459315
RUN test -e /var/run || ln -s /run /var/run

# Check the syntax of the config and dump it
RUN nginx -T

# Copy and extract tileset to nginx web dir
COPY ./tiles/*.tar.gz /tmp/tiles/

# unpack the tiles with multiple cores
RUN for file in /tmp/tiles/*.tar.gz ; do pigz -dc $file | tar -x --overwrite -C /usr/share/nginx/html/ ; done

# remove archives to reduce image size
RUN rm -r /tmp/tiles

# Check if files are correctly placed in nginx web dir 
RUN ls -la /usr/share/nginx/html/
