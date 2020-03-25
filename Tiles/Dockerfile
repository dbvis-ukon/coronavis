FROM nginx:alpine

# Copy nginx configuration to docker container
COPY ./mysite.conf /etc/nginx/conf.d/default.conf

# Copy and extract tileset to nginx web dir
COPY ./covid19_tiles_world_1-10.tar.gz /tmp/
RUN tar -xzf /tmp/covid19_tiles_world_1-10.tar.gz -C /usr/share/nginx/html/
RUN rm /tmp/covid19_tiles_world_1-10.tar.gz

# Check if files are correctly placed in nginx web dir
RUN ls -la /usr/share/nginx/html/
