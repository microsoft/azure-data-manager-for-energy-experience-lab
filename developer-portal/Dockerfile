# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

FROM mcr.microsoft.com/mirror/docker/library/node:22 AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json /app/
RUN npm ci
RUN npm install -g @angular/cli

# Copy the site to the working directory
COPY . /app

# Build the site
RUN npm run build

FROM mcr.microsoft.com/mirror/docker/library/nginx:1.25

COPY nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/dist/developer-portal/browser /usr/share/nginx/html

EXPOSE 80
