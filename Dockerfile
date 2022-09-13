FROM node:18-alpine

WORKDIR /app

COPY node_modules ./node_modules

COPY build .

COPY package.json .

EXPOSE 3000

ENTRYPOINT ["node", "index.js"]