FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Prisma generate chỉ cần URL hợp lệ; runtime thật ghi đè trong docker-compose / env.
ARG DATABASE_URL=postgresql://ci:ci@127.0.0.1:5432/ci?schema=public
ENV DATABASE_URL=$DATABASE_URL

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ARG DATABASE_URL=postgresql://ci:ci@127.0.0.1:5432/ci?schema=public
ENV DATABASE_URL=$DATABASE_URL

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3000

# start-period covers migrate + cold start; failures in this window do not mark unhealthy
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',(r)=>{r.resume();r.on('end',()=>process.exit(r.statusCode===200?0:1));}).on('error',()=>process.exit(1))"

# /bin/sh avoids "no such file" when Windows CRLF breaks shebang on ./script
ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"]
CMD ["node", "dist/src/index.js"]
