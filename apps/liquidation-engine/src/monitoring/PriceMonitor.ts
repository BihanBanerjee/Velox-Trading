/**
 * Price Monitor 
 * Monitors real-time price updates and triggers automatic liquidations
 * based on margin calls, stop loss, and take profit conditions
 */

import type { Asset } from "@exness/prisma-client";
import type { 
    StateManager 
} from "../state/StateManager";
import { add, formatPrice, toInteger } from "@exness/price-utils";
import { calculateCurrentPnL, getLiquidationReason } from "../utils/liquidation";


type LiquidationCallback = (
    orderId: string,
    reason: "MARGIN_CALL" | "STOP_LOSS" | "TAKE_PROFIT",
    pnl: bigint,
    currentPrice: bigint
) => Promise<void>;
// This defines a function signature that any liquidation callback must follow.

export class PriceMonitor {
    private liquidationCallback: LiquidationCallback | null = null;

    constructor(private state: StateManager) {}
    /**
     * Set callback for when liquidations occur
     */

    setLiquidationCallback(callback: LiquidationCallback): void {
        this.liquidationCallback = callback
    }

    /**
     * Process market price update for an asset
     * Checks all open orders for this asset and triggers liquidations if needed
     */
    async processMarketUpdate(symbol: Asset, bidPrice: number, askPrice: number ): Promise<void> {
        const bidPriceInt = toInteger(bidPrice);
        const askPriceInt = toInteger(askPrice);

        // Get all open orders for this asset
        const orders = this.state.getOpenOrdersByAsset(symbol);

        if (orders.length === 0) {
            return // No orders to process
        }

        console.log(
            `Processing ${orders.length} open orders for ${symbol} | Bid: ${formatPrice(bidPriceInt, 2)} | Ask: ${formatPrice(askPriceInt, 2)}` 
        );
        
        for (const order of orders) {
            try {
                // Use appropriate price based on position type
                // LONG: sell at bid price when closing
                // SHORT: buy at ask price when closing
                const currentPriceInt = order.orderType === "LONG" ? bidPriceInt : askPriceInt;

                // Calculate current P&L
                const currentPnLInt = calculateCurrentPnL(
                    currentPriceInt,
                    order.executionPriceInt,
                    order.qtyInt,
                    order.orderType
                );

                // Check if liquidation should occur
                const liquidationReason = getLiquidationReason(
                    currentPriceInt,
                    order.liquidationPriceInt,
                    currentPnLInt,
                    order.stopLossInt,
                    order.takeProfitInt,
                    order.orderType
                );

                if(liquidationReason && this.liquidationCallback) {
                    console.log(
                        `Liquidating order ${order.orderId} | Reason: ${liquidationReason} | P&L: ${formatPrice(currentPnLInt)}`
                    );

                    await this.liquidationCallback(
                        order.orderId,
                        liquidationReason,
                        currentPnLInt,
                        currentPriceInt
                    );
                }
            } catch (error) {
                console.error(`Error processing order ${order.orderId}`, error);
                
            }
        }
    }

    /**
     * Liquidate an order (called internally by price monitor)
     * Updates state with final P&L and returns margin + P&L to user
     */

    async liquidateOrder(
        orderId: string,
        reason: "MARGIN_CALL" | "STOP_LOSS" | "TAKE_PROFIT",
        pnlInt: bigint
    ): Promise<void> {
        const order = this.state.getOrder(orderId);
        if(!order) {
            console.warn(`Order ${orderId} not found during liquidation`);
            return;
        }

        if(order.status === "CLOSED") {
            console.warn(`Order ${orderId} already closed`);
            return;
        }

        // Close the order
        this.state.closeOrder(orderId, pnlInt, reason);

        // Return margin + P&L to user balance
        const currentBalance = this.state.getBalance(order.userId);
        const newBalance = add(add(currentBalance, order.marginInt), pnlInt)
        this.state.updateBalance(order.userId, newBalance);

        console.log(
            `Order ${orderId} liquidated | User: ${order.userId} | Reason: ${reason} | P&L: ${formatPrice(pnlInt)} | New Balance: ${formatPrice(newBalance)}`
        );
    }

    /**
     * Get statistics on monitored orders
     */

    getMonitoringStats() {
        const allOpenOrders = this.state.getAllOpenOrders();

        const byAsset: Record<string, number> = {};
        const byType: Record<string, number> = { LONG: 0, SHORT: 0 };

        for (const order of allOpenOrders) {
            byAsset[order.asset] = (byAsset[order.asset] || 0) + 1;
            byType[order.orderType] = (byType[order.orderType] || 0) + 1;
        }

        return {
            totalOpenOrders: allOpenOrders.length,
            byAsset,
            byType
        };
    }
}