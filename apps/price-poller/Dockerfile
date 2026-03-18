FROM oven/bun:1.3 AS base

WORKDIR /app

# ── Install dependencies ──
FROM base AS deps

COPY package.json bun.lock turbo.json ./

# Copy ALL workspace package.json files (bun needs full workspace resolution)
COPY apps/price-poller/package.json ./apps/price-poller/
COPY apps/http-backend/package.json ./apps/http-backend/
COPY apps/realtime-server/package.json ./apps/realtime-server/
COPY apps/liquidation-engine/package.json ./apps/liquidation-engine/
COPY apps/db-worker/package.json ./apps/db-worker/
COPY apps/batch-uploader/package.json ./apps/batch-uploader/
COPY packages/redis-client/package.json ./packages/redis-client/
COPY packages/redis-stream-types/package.json ./packages/redis-stream-types/
COPY packages/prisma-client/package.json ./packages/prisma-client/
COPY packages/price-utils/package.json ./packages/price-utils/
COPY packages/validation/package.json ./packages/validation/
COPY packages/ui/package.json ./packages/ui/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

RUN bun install

# ── Build stage ──
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/price-poller ./apps/price-poller

# ── Runtime ──
FROM base AS runtime

COPY --from=build /app ./

WORKDIR /app/apps/price-poller

CMD ["bun", "run", "index.ts"]
