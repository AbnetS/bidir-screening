# Dockerfile for screening service

FROM node:6.9.5

MAINTAINER Tony Mutai <tony@gebeya.com>

ADD . /home/screening

WORKDIR /home/screening

RUN npm install

EXPOSE 8040

ENTRYPOINT ["node", "app.js"]
