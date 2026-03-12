FROM oven/bun:1.3 AS base

WORKDIR /app

# ── Install dependencies ──
FROM base AS deps

# Copy root workspace files
COPY package.json bun.lock turbo.json ./

# Copy all package manifests (workspace resolution needs these)
COPY apps/http-backend/package.json ./apps/http-backend/
COPY packages/prisma-client/package.json ./packages/prisma-client/
COPY packages/redis-client/package.json ./packages/redis-client/
COPY packages/redis-stream-types/package.json ./packages/redis-stream-types/
COPY packages/price-utils/package.json ./packages/price-utils/
COPY packages/validation/package.json ./packages/validation/

# Install all dependencies
RUN bun install --frozen-lockfile

# ── Build stage ──
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY package.json bun.lock turbo.json ./
COPY packages ./packages
COPY apps/http-backend ./apps/http-backend

# Generate Prisma client
RUN cd packages/prisma-client && bunx prisma generate

# ── Runtime ──
FROM base AS runtime

COPY --from=build /app ./

WORKDIR /app/apps/http-backend

EXPOSE 3005

CMD ["bun", "run", "index.ts"]
