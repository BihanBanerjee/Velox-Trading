/**
 * Redis Stream Utilities
 * Provides functions for publishing to and consuming from Redis Streams
 * Used for request/response communication between HTTP-BACKEND and Liquidation Engine
 */

import Redis from "ioredis";

const DEFAULT_TIMEOUT = 5000; // 5 seconds
const BLOCK_MS = 1000; // Block for 1 second when reading from the stream
const MAX_STREAM_LENGTH = 10000; // Trim streams to memory issue

