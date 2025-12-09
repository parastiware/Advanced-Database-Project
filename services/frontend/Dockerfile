FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps && npm install --save-dev ajv@latest

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
