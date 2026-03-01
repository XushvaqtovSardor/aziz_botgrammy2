FROM node:22-alpine
WORKDIR /app


RUN corepack enable && corepack prepare pnpm@latest --activate


COPY package.json pnpm-lock.yaml* ./

COPY prisma ./prisma
RUN pnpm install --shamefully-hoist


COPY . .

RUN npx prisma generate

RUN pnpm run build

EXPOSE 3000

CMD sh -c "npx prisma migrate deploy && node dist/src/main.js"