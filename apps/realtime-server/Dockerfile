FROM oven/bun:1.3 AS base

WORKDIR /app

# ── Install dependencies ──
FROM base AS deps

COPY package.json bun.lock turbo.json ./

COPY apps/realtime-server/package.json ./apps/realtime-server/
COPY packages/redis-client/package.json ./packages/redis-client/
COPY packages/redis-stream-types/package.json ./packages/redis-stream-types/

RUN bun install --frozen-lockfile

# ── Build stage ──
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules

COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/realtime-server ./apps/realtime-server

# ── Runtime ──
FROM base AS runtime

COPY --from=build /app ./

WORKDIR /app/apps/realtime-server

EXPOSE 3006

CMD ["bun", "run", "index.ts"]
