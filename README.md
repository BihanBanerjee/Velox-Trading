# Crypto Trading Platform

A high-performance, real-time cryptocurrency trading platform with automatic liquidation, leveraged trading, and live price streaming. Built with a microservices architecture using TypeScript, Redis Streams, PostgreSQL/TimescaleDB, and WebSockets.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Services](#services)
- [API Documentation](#api-documentation)
- [Data Flow](#data-flow)
- [Features](#features)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Development](#development)

---

## Overview

This platform enables users to trade cryptocurrencies (BTC, ETH, SOL) with leverage up to 100x. It features:

- Real-time price streaming from Binance
- Leveraged LONG/SHORT positions
- Automatic liquidation monitoring (margin calls, stop-loss, take-profit)
- Historical candlestick charts
- BigInt precision arithmetic (no floating-point errors)
- Event sourcing with crash recovery
- WebSocket-based real-time updates

**Key Metrics:**
- Initial user balance: $1,000 (virtual)
- Supported assets: BTCUSDT, ETHUSDT, SOLUSDT
- Leverage range: 1x - 100x
- Price precision: 8 decimal places (10^8 integer scale)
- Snapshot persistence: Every 15 seconds

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Binance API   │
│   (WebSocket)   │
└────────┬────────┘
         │ Real-time prices
         ↓
┌─────────────────────────────────────────────────────────────┐
│                      PRICE POLLER                           │
│  - Applies 0.1% bid/ask spread                             │
│  - Dual price streams (manipulated + honest)               │
└──────────┬────────────────────────────┬─────────────────────┘
           │                            │
           │ Manipulated prices         │ Honest prices
           ↓                            ↓
    ┌──────────────┐            ┌──────────────────┐
    │ Redis Stream │            │  Redis Stream    │
    │  (trading)   │            │  (charting)      │
    └──────┬───────┘            └────────┬─────────┘
           │                             │
           ↓                             ↓
┌──────────────────────┐        ┌────────────────┐
│ LIQUIDATION ENGINE   │        │ BATCH UPLOADER │
│ - Order management   │        │ - Candle data  │
│ - Auto-liquidation   │        └────────┬───────┘
│ - State snapshots    │                 │
└──────┬───────────────┘                 │
       │                                 │
       ↓                                 ↓
┌──────────────┐                ┌────────────────┐
│ Redis Stream │                │  TimescaleDB   │
│ (responses)  │                │  (candles)     │
└──────┬───────┘                └────────────────┘
       │
       ├───→ HTTP Backend → Frontend
       │
       └───→ DB Worker → PostgreSQL (closed orders)
```

### Request Flow

```
Frontend
   ↓ HTTP POST /api/v1/order/open
HTTP Backend (Port 3005)
   ↓ Validate & publish to Redis Stream
Redis Stream (request:stream)
   ↓ XREAD
Liquidation Engine (In-memory state)
   ↓ Process & update state
Redis Queue (response:queue)
   ↓ Subscriber pattern
HTTP Backend
   ↓ JSON response
Frontend
```

---

## Tech Stack

### Backend Services
- **Runtime:** Bun (JavaScript runtime)
- **Language:** TypeScript
- **HTTP Framework:** Express.js
- **WebSocket:** ws library
- **Message Queue:** Redis Streams
- **Pub/Sub:** Redis Pub/Sub
- **Database:** PostgreSQL 17 with TimescaleDB
- **ORM:** Prisma
- **Authentication:** JWT (httpOnly cookies)
- **Price Source:** Binance WebSocket API

### Shared Packages
- **@exness/prisma-client:** Database client
- **@exness/redis-client:** Redis client wrapper
- **@exness/redis-stream-types:** Type-safe stream messages
- **@exness/price-utils:** BigInt price calculations

---

## Project Structure

```
ExnessRedoMine/
├── apps/
│   ├── batch-uploader/       # Batch insert candle data to TimescaleDB
│   ├── db-worker/            # Persist closed orders to PostgreSQL
│   ├── http-backend/         # REST API server (Express)
│   ├── liquidation-engine/   # Core trading engine with auto-liquidation
│   ├── price-poller/         # Fetch prices from Binance & distribute
│   └── realtime-server/      # WebSocket server for live price streaming
├── packages/
│   ├── price-utils/          # BigInt arithmetic utilities
│   ├── prisma-client/        # Prisma schema & generated client
│   ├── redis-client/         # Redis client & subscriber
│   └── redis-stream-types/   # Type definitions for Redis messages
└── README.md
```

---

## Getting Started

### Prerequisites

- **Bun** v1.3.4 or higher
- **Docker** and **Docker Compose**
- **PostgreSQL** 17 with TimescaleDB extension
- **Redis** 7.x

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ExnessRedoMine
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Start infrastructure services**
   ```bash
   docker-compose up -d
   # Starts PostgreSQL (port 5432) and Redis (port 6380)
   ```

4. **Run database migrations**
   ```bash
   cd packages/prisma-client
   bunx prisma migrate deploy
   cd ../..
   ```

5. **Start all services**
   ```bash
   # Terminal 1: Price Poller
   cd apps/price-poller
   bun run index.ts

   # Terminal 2: Liquidation Engine
   cd apps/liquidation-engine
   bun run index.ts

   # Terminal 3: Batch Uploader
   cd apps/batch-uploader
   bun run index.ts

   # Terminal 4: DB Worker
   cd apps/db-worker
   bun run index.ts

   # Terminal 5: Realtime Server
   cd apps/realtime-server
   bun run index.ts

   # Terminal 6: HTTP Backend
   cd apps/http-backend
   bun run index.ts
   ```

### Quick Start (Development)

All services should be running on:
- HTTP API: `http://localhost:3005`
- WebSocket: `ws://localhost:3006`
- Redis: `localhost:6380`
- PostgreSQL: `localhost:5432`

---

## Services

### 1. Price Poller (`apps/price-poller`)

**Purpose:** Fetches real-time prices from Binance and distributes them.

**Key Features:**
- WebSocket connection to Binance for BTC, ETH, SOL
- Applies 0.1% bid/ask spread for trading
- Dual price streams:
  - Manipulated prices → Liquidation Engine (for P&L calculation)
  - Honest prices → Batch Uploader (for charts)
- Redis Pub/Sub broadcast to Realtime Server

**Output Streams:**
- `request:stream` - Trading prices
- `batch:uploader:stream` - Chart data
- `market:*` - Pub/Sub channels

---

### 2. Liquidation Engine (`apps/liquidation-engine`)

**Purpose:** Core trading engine with in-memory state and auto-liquidation.

**Key Features:**
- In-memory order book and user balances
- Request processing (PLACE_ORDER, CLOSE_ORDER, GET_BALANCE, etc.)
- Automatic liquidation monitoring:
  - Margin call (90% loss threshold)
  - Stop-loss triggers
  - Take-profit triggers
- State snapshots every 15 seconds
- Event replay on startup for crash recovery
- BigInt precision arithmetic

**Engine Status:**
- `STARTING` - Initialization
- `REPLAYING` - Event replay (rejects requests)
- `READY` - Accepting requests
- `SHUTDOWN` - Graceful shutdown

**Supported Requests:**
- `REGISTER_USER` - Initialize user with balance
- `PLACE_ORDER` - Open LONG/SHORT position
- `CLOSE_ORDER` - Close position with P&L
- `GET_BALANCE` - Retrieve user balance
- `GET_ORDER` - Get order details
- `GET_USER_ORDERS` - List user's orders

---

### 3. HTTP Backend (`apps/http-backend`)

**Purpose:** REST API server for frontend integration.

**Endpoints:**

**Authentication:**
- `POST /api/v1/user/signup` - User registration
- `POST /api/v1/user/signin` - User login
- `POST /api/v1/user/signout` - User logout

**Order Management:**
- `POST /api/v1/order/open` - Open new order
- `POST /api/v1/order/close/:orderId` - Close order
- `GET /api/v1/order/:orderId` - Get order details
- `GET /api/v1/order/user/orders?status=OPEN|CLOSED` - List orders
- `GET /api/v1/order/user/balance` - Get user balance

**Candle Data:**
- `GET /candles?asset=BTCUSDT&duration=1m` - Historical candles
  - Durations: 1m, 2m, 5m, 10m, 1d
  - Returns up to 1000 candles

**Authentication:**
- JWT tokens stored in httpOnly cookies
- Automatic engine registration on signup with $1000 balance

---

### 4. Realtime Server (`apps/realtime-server`)

**Purpose:** WebSocket server for live price streaming to frontend.

**Features:**
- WebSocket server on port 3006
- Subscribes to Redis Pub/Sub `market:*` channels
- Broadcasts price updates to all connected clients
- Connection tracking and graceful disconnect handling

**Message Format:**
```json
{
  "type": "price_update",
  "symbol": "BTCUSDT",
  "data": {
    "bidPrice": 92000.50,
    "askPrice": 92092.50,
    "bidPriceInt": "9200050000000",
    "askPriceInt": "9209250000000",
    "timestamp": 1703001234567
  }
}
```

---

### 5. DB Worker (`apps/db-worker`)

**Purpose:** Persists closed orders to PostgreSQL for historical display.

**Features:**
- Listens to `response:stream` for CLOSE_ORDER responses
- Calculates close price from P&L
- Inserts into `ClosedOrder` table
- Non-blocking (won't crash engine on DB errors)
- Handles both manual closures and auto-liquidations

---

### 6. Batch Uploader (`apps/batch-uploader`)

**Purpose:** Batch insert trade data into TimescaleDB for candlestick charts.

**Features:**
- Consumer group for distributed processing
- Batches 100 messages or 5-second timeout
- Inserts into TimescaleDB `Trade` table
- Materialized views for 1m, 2m, 5m, 10m, 1d candles
- Automatic ACK after successful insert

---

## API Documentation

### Authentication

#### Signup
```http
POST /api/v1/user/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": 1234567890,
  "password": "securePassword123"
}

Response:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### Login
```http
POST /api/v1/user/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Order Management

#### Open Order
```http
POST /api/v1/order/open
Content-Type: application/json
Cookie: token=<jwt>

{
  "orderType": "LONG",
  "asset": "BTCUSDT",
  "leverage": 10,
  "qty": 100,
  "stopLoss": 90000,      // Optional
  "takeProfit": 95000     // Optional
}

Response:
{
  "success": true,
  "order": {
    "orderId": "uuid",
    "userId": "uuid",
    "asset": "BTCUSDT",
    "orderType": "LONG",
    "leverage": 10,
    "margin": "10.00",
    "marginInt": "1000000000",
    "executionPrice": "92000.50",
    "executionPriceInt": "9200050000000",
    "qty": "100.00000000",
    "qtyInt": "10000000000",
    "status": "OPEN",
    "currentPnL": "0.00",
    "createdAt": "2023-12-27T10:00:00.000Z"
  },
  "balance": {
    "balance": "990.00",
    "balanceInt": "99000000000"
  }
}
```

#### Close Order
```http
POST /api/v1/order/close/:orderId
Cookie: token=<jwt>

Response:
{
  "success": true,
  "order": {
    "orderId": "uuid",
    "finalPnL": "5.50",
    "finalPnLInt": "550000000",
    "closedAt": "2023-12-27T10:05:00.000Z"
  },
  "balance": {
    "balance": "1005.50",
    "balanceInt": "100550000000"
  }
}
```

#### Get User Orders
```http
GET /api/v1/order/user/orders?status=OPEN
Cookie: token=<jwt>

Response:
{
  "orders": [
    {
      "orderId": "uuid",
      "asset": "BTCUSDT",
      "orderType": "LONG",
      "leverage": 10,
      "margin": "10.00",
      "executionPrice": "92000.50",
      "qty": "100.00000000",
      "currentPnL": "2.50",
      "status": "OPEN",
      "createdAt": "2023-12-27T10:00:00.000Z"
    }
  ]
}
```

#### Get Balance
```http
GET /api/v1/order/user/balance
Cookie: token=<jwt>

Response:
{
  "balance": "1000.00",
  "balanceInt": "100000000000"
}
```

### Candle Data

#### Get Candlesticks
```http
GET /candles?asset=BTCUSDT&duration=1m

Response:
{
  "candles": [
    {
      "time": "2023-12-27T10:00:00.000Z",
      "symbol": "BTCUSDT",
      "open": "92000.50",
      "high": "92150.75",
      "low": "91950.25",
      "close": "92100.00",
      "volume": "1500.50"
    }
  ]
}
```

**Supported durations:** `1m`, `2m`, `5m`, `10m`, `1d`

---

## Data Flow

### Price Data Flow

```
Binance WebSocket
  ↓ Trade events (price, quantity, timestamp)
Price Poller
  ↓ Calculate bid/ask with 0.1% spread
  ├─ Manipulated Prices
  │  ├─ Redis Stream (request:stream) → Liquidation Engine
  │  └─ Redis Pub/Sub (market:*) → Realtime Server → Frontend
  │
  └─ Honest Prices
     └─ Redis Stream (batch:uploader:stream) → Batch Uploader → TimescaleDB
```

### Order Lifecycle

```
1. User opens order
   Frontend → HTTP Backend → Redis Stream (request:stream)

2. Engine processes
   Liquidation Engine reads from stream → Validates → Updates state
   → Publishes response to Redis Queue

3. Response delivered
   HTTP Backend subscriber receives response → Returns to frontend

4. Continuous monitoring
   Price Monitor checks all open orders every price update
   → Triggers liquidation if conditions met

5. Order closed
   Engine publishes CLOSE_ORDER response
   → DB Worker persists to PostgreSQL
   → HTTP Backend returns to frontend
```

### State Persistence

```
Liquidation Engine (in-memory)
  ↓ Every 15 seconds
Snapshot Manager serializes state
  ↓ BigInt → string conversion
PostgreSQL Snapshot table
  ↓ On engine restart
Load latest snapshot + replay events from stream
  ↓ Restore balances and orders
Engine ready to process new requests
```

---

## Features

### Trading Features
- ✅ Leveraged trading (1x - 100x)
- ✅ LONG and SHORT positions
- ✅ Real-time P&L calculation
- ✅ Stop-loss and take-profit orders
- ✅ Automatic margin call liquidation (90% loss)
- ✅ Multi-asset support (BTC, ETH, SOL)

### Technical Features
- ✅ BigInt precision (no floating-point errors)
- ✅ Event sourcing with replay capability
- ✅ Crash recovery via snapshots
- ✅ Real-time WebSocket price streaming
- ✅ Historical candlestick charts
- ✅ Request/response timeout handling
- ✅ Proper bid/ask spread for LONG/SHORT
- ✅ Graceful shutdown handling

### Security Features
- ✅ JWT authentication with httpOnly cookies
- ✅ Password hashing with bcrypt
- ✅ Protected API routes with auth middleware
- ✅ CORS enabled with credentials support

---

## Environment Variables

### HTTP Backend (.env)
```env
PORT=3005
DATABASE_URL=postgresql://user:password@localhost:5432/trading
JWT_SECRET=your-secret-key-here
REDIS_HOST=localhost
REDIS_PORT=6380
NODE_ENV=development
```

### Price Poller (.env)
```env
REDIS_HOST=localhost
REDIS_PORT=6380
```

### Liquidation Engine (.env)
```env
REDIS_HOST=localhost
REDIS_PORT=6380
DATABASE_URL=postgresql://user:password@localhost:5432/trading
```

### Batch Uploader (.env)
```env
REDIS_HOST=localhost
REDIS_PORT=6380
DATABASE_URL=postgresql://user:password@localhost:5432/trading
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  phone INTEGER UNIQUE NOT NULL,
  password VARCHAR NOT NULL
);
```

### Closed Orders Table
```sql
CREATE TABLE closed_orders (
  orderId UUID PRIMARY KEY,
  userId UUID NOT NULL,
  asset VARCHAR NOT NULL,
  orderType VARCHAR NOT NULL,
  leverage INTEGER NOT NULL,
  marginInt BIGINT NOT NULL,
  executionPriceInt BIGINT NOT NULL,
  closePriceInt BIGINT NOT NULL,
  qtyInt BIGINT NOT NULL,
  stopLossInt BIGINT NOT NULL,
  takeProfitInt BIGINT NOT NULL,
  finalPnLInt BIGINT NOT NULL,
  createdAt TIMESTAMP NOT NULL,
  closedAt TIMESTAMP NOT NULL
);

CREATE INDEX idx_closed_orders_user ON closed_orders(userId, closedAt);
CREATE INDEX idx_closed_orders_time ON closed_orders(closedAt);
CREATE INDEX idx_closed_orders_asset ON closed_orders(asset);
```

### Trades Table (TimescaleDB Hypertable)
```sql
CREATE TABLE trades (
  id VARCHAR NOT NULL,
  time TIMESTAMPTZ NOT NULL,
  symbol VARCHAR NOT NULL,
  priceInt BIGINT NOT NULL,
  qtyInt BIGINT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, time)
);

SELECT create_hypertable('trades', 'time');

CREATE INDEX idx_trades_symbol_time ON trades(symbol, time);
```

### Snapshots Table
```sql
CREATE TABLE snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMP DEFAULT NOW(),
  lastStreamId VARCHAR NOT NULL,
  data JSONB NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_snapshots_timestamp ON snapshots(timestamp);
```

---

## Development

### Running Individual Services

```bash
# Price Poller
cd apps/price-poller && bun run index.ts

# Liquidation Engine
cd apps/liquidation-engine && bun run index.ts

# HTTP Backend
cd apps/http-backend && bun run index.ts

# Realtime Server
cd apps/realtime-server && bun run index.ts

# DB Worker
cd apps/db-worker && bun run index.ts

# Batch Uploader
cd apps/batch-uploader && bun run index.ts
```

### Database Migrations

```bash
cd packages/prisma-client

# Create new migration
bunx prisma migrate dev --name migration_name

# Apply migrations
bunx prisma migrate deploy

# Generate Prisma client
bunx prisma generate
```

### Monitoring Redis Streams

```bash
# Check stream length
redis-cli -p 6380 XLEN request:stream
redis-cli -p 6380 XLEN response:stream

# View latest messages
redis-cli -p 6380 XREVRANGE request:stream + - COUNT 10

# Monitor pub/sub channels
redis-cli -p 6380 PSUBSCRIBE market:*
```

### Useful Commands

```bash
# Check TimescaleDB candles
psql -h localhost -U user -d trading
SELECT * FROM candles_1m ORDER BY time DESC LIMIT 10;

# Monitor engine snapshots
SELECT timestamp, lastStreamId FROM snapshots ORDER BY timestamp DESC LIMIT 5;

# Check closed orders
SELECT userId, asset, "finalPnLInt", "closedAt" FROM closed_orders ORDER BY "closedAt" DESC;
```

---

## Architecture Decisions

### Why BigInt?
JavaScript's `Number` type has precision issues with large numbers and decimal calculations. BigInt ensures exact calculations for financial data.

### Why Redis Streams?
Redis Streams provide:
- Message persistence (unlike Pub/Sub)
- Event replay capability
- Consumer groups for scalability
- Guaranteed delivery

### Why In-Memory Engine?
- Ultra-low latency for price monitoring
- Fast P&L calculations
- Real-time liquidation detection
- Snapshots + event replay for durability

### Why TimescaleDB?
- Optimized for time-series data
- Efficient materialized views for candles
- Better performance than regular PostgreSQL for charts

---

## Performance Considerations

- **Price Updates:** ~1000/second per asset (from Binance)
- **Liquidation Checks:** Every price update for all open orders
- **Snapshot Frequency:** 15 seconds (configurable)
- **HTTP Timeout:** 10 seconds for engine requests
- **WebSocket Broadcast:** Real-time to all connected clients

---

## License

MIT

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
