# Service Startup Guide

This guide explains how to start all microservices in the correct order for the Crypto Trading Platform.

## Quick Start

```bash
# Start all services sequentially
bun run start:all
```

Or for development with live logs:
```bash
bun run start:dev
```

## Startup Order

The services must be started in this specific order due to their dependencies:

### 1. Price Poller (FIRST)
**Wait time**: 3 seconds

**Why first?**
- Connects to Binance WebSocket API
- Feeds data to all other services via Redis streams
- No dependencies on other services

**Output streams**:
- `request:stream` → Trading prices for Liquidation Engine
- `batch:uploader:stream` → Chart data for Batch Uploader
- `market:*` (Pub/Sub) → Live prices for Realtime Server

### 2. Liquidation Engine (SECOND)
**Wait time**: 5 seconds

**Why second?**
- Core trading engine that processes all orders
- Needs prices from Price Poller
- Loads state snapshots and replays events on startup
- Takes longer to initialize (5s for event replay)

**Depends on**:
- Price Poller (for trading prices)
- PostgreSQL (for snapshots)
- Redis Streams (`request:stream`)

### 3. Batch Uploader (THIRD)
**Wait time**: 2 seconds

**Why third?**
- Consumes honest price data for candlestick charts
- Independent of trading logic
- Can start once Price Poller is running

**Depends on**:
- Price Poller (for price data)
- TimescaleDB (for candle storage)
- Redis Streams (`batch:uploader:stream`)

### 4. DB Worker (FOURTH)
**Wait time**: 2 seconds

**Why fourth?**
- Persists closed orders to PostgreSQL
- Consumes responses from Liquidation Engine
- Needs Liquidation Engine to be operational

**Depends on**:
- Liquidation Engine (for order closure events)
- PostgreSQL (for storage)
- Redis Streams (`response:stream`)

### 5. Realtime Server (FIFTH)
**Wait time**: 2 seconds

**Why fifth?**
- WebSocket server for frontend price streaming
- Subscribes to Redis Pub/Sub channels
- Can start once Price Poller is publishing

**Depends on**:
- Price Poller (for price broadcasts)
- Redis Pub/Sub (`market:*` channels)

**Port**: 3006

### 6. HTTP Backend (LAST)
**Wait time**: 2 seconds

**Why last?**
- Main entry point for frontend
- Needs Liquidation Engine to process requests
- Should only accept requests when all systems are ready

**Depends on**:
- Liquidation Engine (for order processing)
- PostgreSQL (for user authentication)
- Redis (for request/response queues)

**Port**: 3005

## How It Works

The `start-services.ts` script starts each service sequentially:

1. Uses Bun's `spawn` API to start each service in its directory
2. Runs `bun run start` in each app folder
3. Waits the appropriate time for each service to initialize
4. Services run in the background
5. Script completes and returns terminal

## Service Endpoints

Once all services are running:

- **HTTP API**: `http://localhost:3005`
- **WebSocket**: `ws://localhost:3006`
- **Redis**: `localhost:6380`
- **PostgreSQL**: `localhost:5432`

## Stopping Services

To stop all running services:

```bash
pkill -f "bun run index.ts"
```

Or kill specific services by their process ID (find with `ps aux | grep "bun run index"`)

## Manual Startup

If you prefer to start services manually in separate terminals:

```bash
# Terminal 1: Price Poller
turbo run start --filter=@exness/price-poller

# Terminal 2: Liquidation Engine (wait 3s)
turbo run start --filter=liquidation-engine

# Terminal 3: Batch Uploader (wait 5s)
turbo run start --filter=@exness/batch-uploader

# Terminal 4: DB Worker (wait 2s)
turbo run start --filter=db-worker

# Terminal 5: Realtime Server (wait 2s)
turbo run start --filter=realtime-server

# Terminal 6: HTTP Backend (wait 2s)
turbo run start --filter=@exness/http-backend
```

## Troubleshooting

### Service fails to start
- Check that Redis and PostgreSQL are running: `docker-compose up -d`
- Check environment variables are set correctly
- Verify database migrations are up to date: `cd packages/prisma-client && bunx prisma migrate deploy`

### Liquidation Engine startup is slow
- This is expected - it loads snapshots and replays events
- If it takes longer than 10s, check for large event history in Redis streams

### Price Poller can't connect to Binance
- Check internet connection
- Binance WebSocket API might be temporarily unavailable
- Try restarting the service

## Architecture Diagram

```
Binance → Price Poller → Redis Streams/Pub-Sub
                ↓              ↓              ↓
       Liquidation Engine  Batch Uploader  Realtime Server
                ↓              ↓              ↓
           DB Worker     TimescaleDB   WebSocket Clients
                ↓
          PostgreSQL
                ↑
           HTTP Backend ← Frontend
```

## Environment Setup

Before starting services, ensure:

1. Infrastructure is running:
   ```bash
   docker-compose up -d
   ```

2. Dependencies are installed:
   ```bash
   bun install
   ```

3. Database is migrated:
   ```bash
   cd packages/prisma-client
   bunx prisma migrate deploy
   ```

4. Environment variables are configured (see [README.md](README.md#environment-variables))
