# Dockerfile for bidir dev env't reports service
FROM node:10.15.3

MAINTAINER Teferi Assefa <teferi.assefa@gmail.com>

ADD . /usr/src/app 

WORKDIR /usr/src/app

RUN npm install
RUN apt-get update && apt-get install -y \
    libreoffice --no-install-recommends

EXPOSE 8180

ENTRYPOINT ["node", "app.js"]

