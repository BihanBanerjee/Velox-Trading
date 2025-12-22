/**
 * Liquidation Engine 
 * Stateful service that maintains global state of all users, orders and balances.
 * Communicates with API via Redis Streams.
 * Features:
 * - Request/Response pattern for order operations
 * - Real-time price monitoring and automatic liquidation
 * - Periodic snapshots every 15 seconds
 * - Event replay for crash recovery
 */

import redisClient from "@exness/redis-client";
import type { StateManager } from "./src/state/StateManager";


// -----------------------------Configuration-----------------------------

const CONSUMER_GROUP = "liquidation-engine-group";
const CONSUMER_ID = `engine-${process.pid}`; // Unique consumer ID using process ID
const SNAPSHOT_INTERVAL_MS = 15000; // 15 seconds

// -----------------------------Global State-----------------------------

let state: StateManager;
