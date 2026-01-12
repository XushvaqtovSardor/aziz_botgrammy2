FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY package*.json ./ 
RUN pnpm install
COPY . .
RUN pnpm prisma generate
RUN pnpm build

CMD [ "pnpm","run","start:dev" ]