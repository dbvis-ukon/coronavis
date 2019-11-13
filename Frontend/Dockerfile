# Declare which image to pull
# We use a minimal system with NodeJS and NPM installed
FROM node:lts-buster-slim

# Set working directory
ENV APP_DIR=/var/opt/gis

# Copy data
COPY ./gis ${APP_DIR}

# Set working directory
WORKDIR ${APP_DIR}

# Install requirements
RUN npm install

# Start development server
CMD sh -c "npm install && npm run start:docker"
