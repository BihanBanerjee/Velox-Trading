FROM oven/bun:1.3 AS base

WORKDIR /app

# ── Install dependencies ──
FROM base AS deps

COPY package.json bun.lock turbo.json ./

COPY apps/db-worker/package.json ./apps/db-worker/
COPY packages/prisma-client/package.json ./packages/prisma-client/
COPY packages/redis-client/package.json ./packages/redis-client/
COPY packages/redis-stream-types/package.json ./packages/redis-stream-types/
COPY packages/price-utils/package.json ./packages/price-utils/

RUN bun install --frozen-lockfile

# ── Build stage ──
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/db-worker ./apps/db-worker

RUN cd packages/prisma-client && bunx prisma generate

# ── Runtime ──
FROM base AS runtime

COPY --from=build /app ./

WORKDIR /app/apps/db-worker

CMD ["bun", "run", "index.ts"]
