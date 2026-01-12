FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

RUN pnpm prisma generate
COPY . .




RUN pnpm prisma generate


COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

RUN addgroup -g 1001 -S nodejs && \
adduser -S nestjs -u 1001 && \
chown -R nestjs:nodejs /app

USER nestjs
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["./docker-entrypoint.sh"]
RUN pnpm build