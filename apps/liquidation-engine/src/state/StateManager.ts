/**
 * Global State Manager
 * Maintains in-memory state of all users, orders, and balances
 * This is the single source of truth for the liquidation engine
 */


import type { Asset, OrderStatus } from "@exness/prisma-client";
import { formatPrice } from "@exness/price-utils";
import type { OrderState, StateSnapshot, UserState } from "@exness/redis-stream-types";

export class StateManager {
    // In-memory state
    private users: Map<string, UserState> = new Map();
    private orders: Map<string, OrderState > = new Map();

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
    getOrder(orderId: string): OrderState | undefined {
        return this.orders.get(orderId);
    }

    /**
     * Add new order to state
     */

    addOrder(order: OrderState): void {
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
    updateOrder(orderId: string, updates: Partial<OrderState>): void {
        const order = this.orders.get(orderId);
        if (order) {
            Object.assign(order, updates);
        }
    }

    /**
     * Close an order (update status and P&L)
     */
    closeOrder(orderId: string, finalPnLInt: bigint): void {
        const order = this.orders.get(orderId);
        if(order) {
            order.status = "CLOSED";
            order.finalPnLInt = finalPnLInt;
        }
    }

    /**
     * Get all orders for a user
     */

    getUserOrders(userId: string, statusFilter?: OrderStatus): OrderState[] { // OrdeStatus allows "Liquidated" also, we are not supposed to get closed or liquidated orders from here, we have a separate db worker for that."
        const user = this.users.get(userId);
        if(!user) return [];

        // user.orders is an array of Order IDs.
        const userOrders = user.orders
        .map((orderId) => this.orders.get(orderId)) // Retrieving the actual orders from the in-memory orders map using the orderIds.
        .filter((order): order is OrderState => order !== undefined); // Type guard to ensure we only keep defined orders.

        if(statusFilter) {
            return userOrders.filter((order) => order.status === statusFilter);
        }

        return userOrders;
    }

    /**
     * Get all open orders for a specific asset
     */
    getOpenOrdersByAsset(asset: Asset): OrderState[] {
        const openOrders: OrderState[] = [];

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
    getAllOpenOrders(): OrderState[] {
        const openOrders: OrderState[] = [];

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

        // Seralize users
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