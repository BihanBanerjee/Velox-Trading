FROM oven/bun:1.3 AS base

WORKDIR /app

# ── Install dependencies ──
FROM base AS deps

COPY package.json bun.lock turbo.json ./

COPY apps/price-poller/package.json ./apps/price-poller/
COPY packages/redis-client/package.json ./packages/redis-client/
COPY packages/redis-stream-types/package.json ./packages/redis-stream-types/

RUN bun install --frozen-lockfile

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
