/**
 * Global State Manager
 * Maintains in-memory state of all users, orders, and balances
 * This is the single source of truth for the liquidation engine
 */


import type { Asset, OrderStatus } from "@exness/prisma-client";
import { formatPrice } from "@exness/price-utils";
import type { OrderData, StateSnapshot, UserState } from "@exness/redis-stream-types";

export class StateManager {
    // In-memory state
    private users: Map<string, UserState> = new Map();
    private orders: Map<string, OrderData > = new Map();

    // Snapshot tracking
    private lastSnapshotTime: number = 0;
    private lastSnapshotId: string = "0-0";
    private lastProcessedStreamId: string = "0-0";

    constructor() {
        console.log("StateManager initialized");
    }

    // ------------------------------------------- User State Management ----------------------------------------
    /**
     * Get user state by ID
     */

    getUser(userId: string): UserState | undefined {
        return this.users.get(userId);
    }

    /**
     * Create or update user state
     */
    setUser(userId: string, balanceInt: bigint): void {
        const existingUser = this.users.get(userId);

        if(existingUser) {
            existingUser.balanceInt = balanceInt;
        } else {
            this.users.set(
                userId,
                {
                    userId,
                    balanceInt,
                    orders: [],
                });
        }
    }

    /**
     * Update user balance
     */

    updateBalance(userId: string, newBalanceInt: bigint): void {
        const user = this.users.get(userId);
        if(user){
            user.balanceInt = newBalanceInt;
        } else {
            // Create new user with this balance
            this.setUser(userId, newBalanceInt);
        }
    }

    /**
     * Get user balance
     */

    getBalance(userId: string): bigint {
        const user = this.users.get(userId);
        return user?.balanceInt ?? 0n;
    }

    /**
     * Check if user has sufficient balance
     */

    hasSufficientBalance(userId: string, requiredAmount: bigint): boolean {
        const balance = this.getBalance(userId);
        return balance >= requiredAmount;
    }

    // ----------------------------------- Order State Management --------------------------------------
    
    /**
     * Get order by ID
     */
    getOrder(orderId: string): OrderData | undefined {
        return this.orders.get(orderId);
    }

    /**
     * Add new order to state
     */

    addOrder(order: OrderData): void {
        this.orders.set(order.orderId, order);

        // Add order ID to user's order list
        const user = this.users.get(order.userId);
        if (user && !user.orders.includes(order.orderId)) {
            user.orders.push(order.orderId);
        }
    }

    /**
     * Update order state
     */
    updateOrder(orderId: string, updates: Partial<OrderData>): void {
        const order = this.orders.get(orderId);
        if (order) {
            Object.assign(order, updates);
        }
    }

    /**
     * Close an order (update status and P&L)
     */
    closeOrder(orderId: string, finalPnLInt: bigint, closeReason?: "MANUAL" | "MARGIN_CALL" | "STOP_LOSS" | "TAKE_PROFIT"): void {
        const order = this.orders.get(orderId);
        if(order) {
            order.status = closeReason && closeReason !== "MANUAL" ? "LIQUIDATED" : "CLOSED";
            order.finalPnLInt = finalPnLInt;
            order.closeReason = closeReason;
        }
    }

    /**
     * Remove a closed/liquidated order from memory
     * Called after db-worker has had time to persist the order
     */
    removeClosedOrder(orderId: string): boolean {
        const order = this.orders.get(orderId);
        if (!order) {
            return false;
        }

        // Only remove orders that are closed or liquidated
        if (order.status !== "CLOSED" && order.status !== "LIQUIDATED") {
            console.warn(`Cannot remove order ${orderId}: status is ${order.status}, not CLOSED/LIQUIDATED`);
            return false;
        }

        // Remove from orders map
        this.orders.delete(orderId);

        // Remove from user's order list
        const user = this.users.get(order.userId);
        if (user) {
            const initialLength = user.orders.length;
            user.orders = user.orders.filter(id => id !== orderId);

            if (user.orders.length === initialLength) {
                console.warn(`Order ${orderId} was not in user ${order.userId}'s order list`);
            }
        }

        return true;
    }

    /**
     * Clean up closed/liquidated orders older than retentionMs
     * This prevents memory from growing indefinitely with historical orders
     * Safe to call periodically - only removes orders that db-worker has had time to persist
     *
     * @param retentionMs How long to keep closed orders in memory (default: 60000ms = 1 minute)
     * @returns Number of orders removed
     */
    cleanupOldClosedOrders(retentionMs: number = 60000): number {
        const now = Date.now();
        let removedCount = 0;
        const ordersToRemove: string[] = [];

        // First pass: identify orders to remove
        for (const [orderId, order] of this.orders.entries()) {
            if (order.status === "CLOSED" || order.status === "LIQUIDATED") {
                const orderAge = now - new Date(order.createdAt).getTime();

                // Remove if order is older than retention period
                if (orderAge > retentionMs) {
                    ordersToRemove.push(orderId);
                }
            }
        }

        // Second pass: remove identified orders
        for (const orderId of ordersToRemove) {
            if (this.removeClosedOrder(orderId)) {
                removedCount++;
            }
        }

        if (removedCount > 0) {
            console.log(`[Cleanup] Removed ${removedCount} old closed/liquidated orders from memory`);
        }

        return removedCount;
    }

    /**
     * Get all orders for a user
     */

    getUserOrders(userId: string, statusFilter?: OrderStatus): OrderData[] { // OrdeStatus allows "Liquidated" also, we are not supposed to get closed or liquidated orders from here, we have a separate db worker for that."
        const user = this.users.get(userId);
        if(!user) return [];

        // user.orders is an array of Order IDs.
        const userOrders = user.orders
        .map((orderId) => this.orders.get(orderId)) // Retrieving the actual orders from the in-memory orders map using the orderIds.
        .filter((order): order is OrderData => order !== undefined); // Type guard to ensure we only keep defined orders.

        if(statusFilter) {
            return userOrders.filter((order) => order.status === statusFilter);
        }

        return userOrders;
    }

    /**
     * Get all open orders for a specific asset
     */
    getOpenOrdersByAsset(asset: Asset): OrderData[] {
        const openOrders: OrderData[] = [];

        for(const order of this.orders.values()) {
            if(order.status === "OPEN" && order.asset === asset) {
                openOrders.push(order);
            }
        }

        return openOrders;
    }

    /**
     * Get all open orders
     */
    getAllOpenOrders(): OrderData[] {
        const openOrders: OrderData[] = [];

        for (const order of this.orders.values()) {
            if(order.status === "OPEN") {
                openOrders.push(order)
            }
        }

        return openOrders;
    }


    // ------------------------------------- Snapshot Management-----------------------------------------

    /**
     * Create a snapshot of the current state
     */

    createSnapshot(snapshotId: string, lastStreamId: string): StateSnapshot {
        const snapshot: StateSnapshot = {
            snapshotId,
            timestamp: Date.now(),
            lastStreamId,
            users: {},
            orders: {},
        }

        // Serialize users
        for (const [userId, user] of this.users.entries()) {
            snapshot.users[userId] = { ...user };
        }

        // Serialize orders
        for (const [orderId, order] of this.orders.entries()) {
            snapshot.orders[orderId] = { ...order };
        }

        this.lastSnapshotTime = snapshot.timestamp;
        this.lastSnapshotId = snapshotId;
        this.lastProcessedStreamId = lastStreamId

        return snapshot;
    }

    /**
     * Restore state from a snapshot
     */

    restoreFromSnapshot(snapshot: StateSnapshot): void {
        console.log(`Restoring state from snapshot ${snapshot.snapshotId}`);

        //Clear current state
        this.users.clear();
        this.orders.clear();

        // Restore users
        for (const [userId, user] of Object.entries(snapshot.users)) {
            this.users.set(userId, { ...user });
        }

        // Restore orders
        for(const [orderId, order] of Object.entries(snapshot.orders)) {
            this.orders.set(orderId, { ...order });
        }

        this.lastSnapshotTime = snapshot.timestamp;
        this.lastSnapshotId = snapshot.snapshotId;
        this.lastProcessedStreamId = snapshot.lastStreamId;

        console.log(`State restored: ${this.users.size} users, ${this.orders.size} orders`);   
    }

    /**
     * Get the last processed stream ID (for replay)
     */

    getLastProcessedStreamId(): string {
        return this.lastProcessedStreamId;
    }

    /**
     * Update the last processed stream ID
     */
    setLastProcessedStreamId(streamId: string): void {
        this.lastProcessedStreamId = streamId
    }

    /**
     * Get time since last snapshot
     */
    getTimeSinceLastSnapshot(): number {
        return Date.now() - this.lastSnapshotTime;
    }

    /**
     * Get last snapshot ID
     */

    getLastSnapShotId(): string {
        return this.lastSnapshotId;
    }

    // -------------------------------- Statistics & Debugging --------------------------------------
    /**
     * Get state statistics
     */
    getStats() {
        const openOrders = this.getAllOpenOrders();
        const closedOrders = Array.from(this.orders.values()).filter(
            (o) => o.status === "CLOSED"
        );

        let totalBalance = 0n;
        for (const user of this.users.values()) {
            totalBalance += user.balanceInt;
        }

        return {
            userCount: this.users.size,
            totalOrders: this.orders.size,
            openOrders: openOrders.length,
            closedOrders: closedOrders.length,
            totalBalanceInt: totalBalance,
            totalBalance: formatPrice(totalBalance, 2),
            lastSnapshotId: this.lastSnapshotId,
            lastProcessedStreamId: this.lastProcessedStreamId,
            timeSinceLastSnapshot: this.getTimeSinceLastSnapshot(),
        };
    }

    /**
     * Log current state summary
     */

    logState(): void {
    const stats = this.getStats();
    console.log("=== State Summary ===");
    console.log(`Users: ${stats.userCount}`);
    console.log(`Orders: ${stats.totalOrders} (${stats.openOrders} open, ${stats.closedOrders} closed)`);
    console.log(`Total Balance: ${stats.totalBalance}`);
    console.log(`Last Snapshot: ${stats.lastSnapshotId}`);
    console.log(`Last Stream ID: ${stats.lastProcessedStreamId}`);
    console.log("====================");
  }

  /**
   * Check if state is empty (useful for initialization)
   */
  isEmpty(): boolean {
    return this.users.size === 0 && this.orders.size === 0;
  }

  /**
   * Clear all state (for testing)
   */

  clear():void {
    this.users.clear();
    this.orders.clear();
    this.lastSnapshotTime = 0;
    this.lastSnapshotId = "0-0";
    this.lastProcessedStreamId = "0-0";
  }

} 