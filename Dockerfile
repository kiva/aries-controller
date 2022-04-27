FROM node:16.14.2-alpine3.15
RUN mkdir www/
WORKDIR www/
ADD package.json package-lock.json ./
#RUN npm install
COPY ./node_modules ./node_modules
ADD . .
CMD [ "npm", "run", "start" ]
