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
import { StateManager } from "./src/state/StateManager";
import { RequestHandler } from "./src/handlers/RequestHandlers";
import { SnapshotManager } from "./src/persistence/SnapshotManager";
import { PriceMonitor } from "./src/monitoring/PriceMonitor";


// -----------------------------Configuration-----------------------------

const CONSUMER_GROUP = "liquidation-engine-group";
const CONSUMER_ID = `engine-${process.pid}`; // Unique consumer ID using process ID
const SNAPSHOT_INTERVAL_MS = 15000; // 15 seconds

// -----------------------------Global State-----------------------------

let state: StateManager;
let requestHandler: RequestHandler;
let snapshotManager: SnapshotManager;
let priceMonitor: PriceMonitor;
let snapshotTimer: NodeJS.Timeout | null = null;
let currentStreamId = "0-0";

// ------------------------------Initialization-------------------------------

/**
 * Initialize the engine - load snapshot and replay events
 */

async function initialize (): Promise<void> {
    console.log("==".repeat(60));
    console.log("Liquidation Engine Starting.....");
    console.log("=".repeat(60));

    // Initialize components
    state = new StateManager();
    requestHandler = new RequestHandler(state);
    snapshotManager = new SnapshotManager(state);
    priceMonitor = new PriceMonitor(state);    
    
    
}