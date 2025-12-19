/**
 * Engine Client
 * Stateless client for communicating with the Liquidation Engine via Redis Streams.
 * Implements request-response pattern with timeout handling.
 */

import redisClient from "@exness/redis-client";