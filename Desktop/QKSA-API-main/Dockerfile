FROM node:21-alpine

PORT 9999


RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app


COPY package*.json /usr/src/app/

RUN npm install

COPY . /usr/src/app

RUN npm run build

EXPOSE 9999

ENTRYPOINT ["npm", "start"]