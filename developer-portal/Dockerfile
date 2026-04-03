# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM mcr.microsoft.com/mirror/docker/library/node:18 as build

WORKDIR /app

# Install dependencies
COPY package.json /app/package.json
RUN npm install
RUN npm install -g @angular/cli

# Copy the site to the working directory
COPY . /app

# Build the site
RUN npm run build

FROM mcr.microsoft.com/mirror/docker/library/nginx:1.21

COPY nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/dist/developer-portal /usr/share/nginx/html

EXPOSE 80
