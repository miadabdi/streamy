FROM node:20-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

USER node

WORKDIR /home/node/app

COPY --chown=node:node package*.json ./

RUN npm install

COPY --chown=node:node . .

EXPOSE 3000

RUN npm run build

RUN chmod +x entrypoint.sh

ENTRYPOINT [ "./entrypoint.sh" ]
