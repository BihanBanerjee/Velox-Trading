-- ============================================================================
-- TimescaleDB Setup: Hypertable, Continuous Aggregates, Compression, Retention
-- ============================================================================
-- This script is idempotent — safe to run multiple times.
-- Run once after the trades table exists (after Prisma migration).
--
-- What this gives you:
--   1. trades hypertable with 6-hour chunks
--   2. 7 continuous aggregates (30s, 1m, 5m, 15m, 1h, 4h, 1d) for chart candles
--   3. Auto-compression every 6 hours (compresses chunks older than 6h)
--   4. Auto-retention drops raw trade data older than 7 days
--   5. Continuous aggregates keep their data EVEN after raw trades are dropped
--      (materialized_only = true), so charts still have full history
-- ============================================================================


-- ── 1. Convert trades to hypertable (skip if already done) ──────────────────
SELECT create_hypertable('trades', 'time',
  chunk_time_interval => INTERVAL '6 hours',
  if_not_exists => TRUE,
  migrate_data => TRUE
);


-- ── 2. Continuous Aggregates (OHLCV candles for chart) ──────────────────────
-- Each aggregate pre-computes open/high/low/close/volume per time bucket.
-- materialized_only => false: queries combine materialized data + recent raw data
-- so charts always show the latest candles even before the next refresh.

-- 30-second candles
CREATE MATERIALIZED VIEW IF NOT EXISTS trades_30s
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('30 seconds', time) AS bucket,
  symbol,
  FIRST("priceInt", time) AS open,
  MAX("priceInt") AS high,
  MIN("priceInt") AS low,
  LAST("priceInt", time) AS close,
  SUM("qtyInt") AS volume
FROM trades
GROUP BY bucket, symbol
WITH NO DATA;

-- 1-minute candles
CREATE MATERIALIZED VIEW IF NOT EXISTS trades_1m
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 minute', time) AS bucket,
  symbol,
  FIRST("priceInt", time) AS open,
  MAX("priceInt") AS high,
  MIN("priceInt") AS low,
  LAST("priceInt", time) AS close,
  SUM("qtyInt") AS volume
FROM trades
GROUP BY bucket, symbol
WITH NO DATA;

-- 5-minute candles
CREATE MATERIALIZED VIEW IF NOT EXISTS trades_5m
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('5 minutes', time) AS bucket,
  symbol,
  FIRST("priceInt", time) AS open,
  MAX("priceInt") AS high,
  MIN("priceInt") AS low,
  LAST("priceInt", time) AS close,
  SUM("qtyInt") AS volume
FROM trades
GROUP BY bucket, symbol
WITH NO DATA;

-- 15-minute candles
CREATE MATERIALIZED VIEW IF NOT EXISTS trades_15m
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('15 minutes', time) AS bucket,
  symbol,
  FIRST("priceInt", time) AS open,
  MAX("priceInt") AS high,
  MIN("priceInt") AS low,
  LAST("priceInt", time) AS close,
  SUM("qtyInt") AS volume
FROM trades
GROUP BY bucket, symbol
WITH NO DATA;

-- 1-hour candles
CREATE MATERIALIZED VIEW IF NOT EXISTS trades_1h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  symbol,
  FIRST("priceInt", time) AS open,
  MAX("priceInt") AS high,
  MIN("priceInt") AS low,
  LAST("priceInt", time) AS close,
  SUM("qtyInt") AS volume
FROM trades
GROUP BY bucket, symbol
WITH NO DATA;

-- 4-hour candles
CREATE MATERIALIZED VIEW IF NOT EXISTS trades_4h
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('4 hours', time) AS bucket,
  symbol,
  FIRST("priceInt", time) AS open,
  MAX("priceInt") AS high,
  MIN("priceInt") AS low,
  LAST("priceInt", time) AS close,
  SUM("qtyInt") AS volume
FROM trades
GROUP BY bucket, symbol
WITH NO DATA;

-- 1-day candles
CREATE MATERIALIZED VIEW IF NOT EXISTS trades_1d
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time) AS bucket,
  symbol,
  FIRST("priceInt", time) AS open,
  MAX("priceInt") AS high,
  MIN("priceInt") AS low,
  LAST("priceInt", time) AS close,
  SUM("qtyInt") AS volume
FROM trades
GROUP BY bucket, symbol
WITH NO DATA;


-- ── 3. Continuous Aggregate Refresh Policies ────────────────────────────────
-- These auto-refresh the materialized views so charts stay up to date.
-- start_offset: how far back to look for changes
-- end_offset: how close to "now" to materialize (leave a buffer for late data)
-- schedule_interval: how often the refresh job runs

SELECT add_continuous_aggregate_policy('trades_30s',
  start_offset => INTERVAL '1 hour',
  end_offset   => INTERVAL '30 seconds',
  schedule_interval => INTERVAL '30 seconds',
  if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('trades_1m',
  start_offset => INTERVAL '2 hours',
  end_offset   => INTERVAL '1 minute',
  schedule_interval => INTERVAL '1 minute',
  if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('trades_5m',
  start_offset => INTERVAL '4 hours',
  end_offset   => INTERVAL '5 minutes',
  schedule_interval => INTERVAL '5 minutes',
  if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('trades_15m',
  start_offset => INTERVAL '6 hours',
  end_offset   => INTERVAL '15 minutes',
  schedule_interval => INTERVAL '15 minutes',
  if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('trades_1h',
  start_offset => INTERVAL '1 day',
  end_offset   => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('trades_4h',
  start_offset => INTERVAL '3 days',
  end_offset   => INTERVAL '4 hours',
  schedule_interval => INTERVAL '4 hours',
  if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('trades_1d',
  start_offset => INTERVAL '7 days',
  end_offset   => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);


-- ── 4. Make aggregates retain data after raw trades are dropped ─────────────
-- By default (materialized_only = false), aggregates query raw data for the
-- most recent period. But once retention drops raw data, those gaps disappear.
-- Setting materialized_only = true means aggregates ONLY serve pre-computed data,
-- which persists independently of the raw trades table.
-- The refresh policies above keep them up to date, so there's no data loss.

ALTER MATERIALIZED VIEW trades_30s SET (timescaledb.materialized_only = true);
ALTER MATERIALIZED VIEW trades_1m  SET (timescaledb.materialized_only = true);
ALTER MATERIALIZED VIEW trades_5m  SET (timescaledb.materialized_only = true);
ALTER MATERIALIZED VIEW trades_15m SET (timescaledb.materialized_only = true);
ALTER MATERIALIZED VIEW trades_1h  SET (timescaledb.materialized_only = true);
ALTER MATERIALIZED VIEW trades_4h  SET (timescaledb.materialized_only = true);
ALTER MATERIALIZED VIEW trades_1d  SET (timescaledb.materialized_only = true);


-- ── 5. Compression on raw trades ────────────────────────────────────────────
-- Compress chunks older than 6 hours. Runs every 6 hours automatically.
-- Compressed data is still fully queryable — TimescaleDB decompresses on read.

ALTER TABLE trades SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'symbol',
  timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('trades', INTERVAL '6 hours',
  schedule_interval => INTERVAL '6 hours',
  if_not_exists => TRUE
);


-- ── 6. Retention policy on raw trades ───────────────────────────────────────
-- Drop raw trade chunks older than 7 days. The continuous aggregates above
-- retain their pre-computed candle data independently, so chart history remains.

SELECT add_retention_policy('trades', INTERVAL '7 days',
  if_not_exists => TRUE
);


-- ── 7. Verify everything is set up ─────────────────────────────────────────
SELECT '=== Continuous Aggregates ===' AS info;
SELECT view_name, materialized_only
FROM timescaledb_information.continuous_aggregates
WHERE hypertable_name = 'trades';

SELECT '=== Scheduled Jobs ===' AS info;
SELECT application_name, schedule_interval, config
FROM timescaledb_information.jobs
WHERE hypertable_name = 'trades'
   OR hypertable_name IN (
     SELECT materialization_hypertable_name
     FROM timescaledb_information.continuous_aggregates
     WHERE hypertable_name = 'trades'
   );
