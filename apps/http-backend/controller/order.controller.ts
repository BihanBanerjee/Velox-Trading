/**
 * Order controller (Stateless).
 * Thin wrapper that forwards requests to the Liquidation Engine via Redis Streams.
 * No direct database access - all state managed by the engine.
 */

import type { Response } from "express"
import type { authRequest } from "../middleware/auth";
import { engineClient } from "../services/engineClient";
import { prisma, type OrderType, type Asset, type OrderStatus } from "@exness/prisma-client";
import { formatPrice } from "@exness/price-utils";


/**
 * Get a specific order 
 * GET /api/order/:orderId
 */

export const getOrder = async (req: authRequest, res: Response) => {
    try {
        const { orderId } = req.params; 

        if(!req.user) {
            return res.status(401).json({
                error: "User is not authenticated"
            });
        }

        if(!orderId) {
            return res.status(400).json({
                error: "Order ID is required"
            });
        }

        // Send Request to Liquidation Engine
        const response = await engineClient.getOrder(req.user.id, orderId);
        if(response.success) {
            return res.json(response.data?.order)
        } else {
            // Handle specific error codes
            if(response.error?.includes("ORDER_NOT_FOUND")) {
                return res.status(404).json({
                    error: "Order not found"
                });
            }
            return res.status(400).json({
                error: response.error
            });
        }
    } catch(error: any) {
        console.error("Error fetching order:", error);

        // Check for timeout
        if(error.message?.includes("timeout")){
            return res.status(504).json({
                error: "Request timeout - engine may be unavailable"
            });
        }

        return res.status(500).json({
            error: "Internal server error"
        });
    }
};

/**
 * Open a new order
 * POST /api/order/open
 */
export const openOrder = async(req: authRequest, res: Response) => {
    try {
        const user = req.user;
        if(!user) {
            return res.status(401).json({
                error: "User not authenticated"
            });
        }

        const {
            orderType,
            asset,
            leverage,
            qty,
            stopLoss,
            takeProfit
        } : {
            orderType: OrderType;
            asset: Asset;
            leverage: number;
            qty: number;
            stopLoss?: number;
            takeProfit?: number;
        } = req.body;

        // Validation is handled by Zod middleware
        // Send request to the engine
        const response = await engineClient.placeOrder(user.id, {
            orderType,
            asset,
            leverage,
            qty,
            stopLoss,
            takeProfit
        })

        if(response.success) {
            // converts BigInt fields to strings for JSON serialization
            const order = response.data?.order;
            const balance = response.data?.balance;

            return res.json({
                success: true,
                order: {
                    ...order,
                    marginInt: order?.marginInt.toString(),
                    executionPriceInt: order?.executionPriceInt.toString(),
                    qtyInt: order?.qtyInt.toString(),
                    stopLossInt: order?.stopLossInt.toString(),
                    takeProfitInt: order?.takeProfitInt.toString(),
                    liquidationPriceInt: order?.liquidationPriceInt.toString(),
                    finalPnLInt: order?.finalPnLInt.toString(),
                    margin: formatPrice(order!.marginInt, 2),
                    executionPrice: formatPrice(order!.executionPriceInt, 2),
                    qty: formatPrice(order!.qtyInt, 8),
                    liquidationPrice: formatPrice(order!.liquidationPriceInt, 2),
                },
                balance: {
                    ...balance,
                    balanceInt: balance?.balanceInt.toString(),
                    balance: formatPrice(balance!.balanceInt, 2),
                },
            });

        } else {
            // Handle specific error codes:->
            const error = response.error || "Unknown error";

            if(error.includes("INSUFFICIENT_BALANCE")){
                return res.status(400).json({ error })
            }
            if(error.includes("INVALID_LEVERAGE")){
                return res.status(400).json({ error })
            }
            if(error.includes("INVALID_QUANTITY")) {
                return res.status(400).json({ error })
            }
            if(error.includes("PRICE_DATA_UNAVAILABLE")) {
                return res.status(503).json({ error })
            }
            
            return res.status(400).json({ error })
        }
    } catch(error: any) {
        console.error("Error opening order:", error);

        if(error.message?.includes("timeout")) {
            return res.status(504).json({
                error: "Request timeout - engine may be unavailable"
            });
        }
        
        return res.status(500).json({
            error: "Internal server error"
        });
    }
};

/**
 * Close an existing order
 * POST /api/order/close/:orderId
 */

export const closeOrder = async (req: authRequest, res: Response) => {
    try{
        const { orderId } = req.params;
        const user = req.user;

        if(!user) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        if(!orderId) {
            return res.status(400).json({ error: "Order ID is required" });
        }

        // Send request to engine
        const response = await engineClient.closeOrder(user.id, orderId);

        if(response.success) {
            const order = response.data?.order;
            const balance = response.data?.balance;
            const PnL = response.data?.PnL;

            return res.json({
                success: true,
                order: {
                    ...order,
                    marginInt: order?.marginInt.toString(),
                    executionPriceInt: order?.executionPriceInt.toString(),
                    qtyInt: order?.qtyInt.toString(),
                    stopLossInt: order?.stopLossInt.toString(),
                    takeProfitInt: order?.takeProfitInt.toString(),
                    liquidationPriceInt: order?.liquidationPriceInt.toString(),
                    finalPnLInt: order?.finalPnLInt.toString(),
                },
                balance: {
                    ...balance,
                    balanceInt: balance?.balanceInt.toString(),
                    balance: formatPrice(balance!.balanceInt, 2)
                },
                PnL,
            });
        } else {
            const error = response.error || "Unknown error";

            if(error.includes("ORDER_NOT_FOUND")) {
                return res.status(404).json({
                    error: "Order not found"
                });
            }

            if(error.includes("ORDER_ALREADY_CLOSED")) {
                return res.status(400).json({
                    error: "Order is already closed"
                });
            }

            if(error.includes("PRICE_DATA_UNAVAILABLE")) {
                return res.status(503).json({
                    error: "Price data unavailable - try again later"
                });
            }

            return res.status(400).json({ error });
        }
    } catch(error: any) {
        console.error("Error closing order:", error);
        
        if(error.message?.includes("timeout")) {
            return res.status(504).json({
                error: "Request timeout - engine may be unavailable"
            });
        }

        return res.status(500).json({
            error: "Internal server error"
        });
    }
};



/**
 * Get all user orders (with optional status filter)
 * GET /api/orders/user?status=OPEN
 */
export const getUserOrders = async (req: authRequest, res: Response) => {
    try {
        const user = req.user;
        if(!user) {
            return res.status(401).json({
                error: "User not authenticated"
            });
        }

        const { status } = req.query;

        // Closed/Liquidated orders: query PostgreSQL (persisted by db-worker)
        // Open orders: query the engine (in-memory state)
        if (status === "CLOSED" || status === "LIQUIDATED") {
            const closedOrders = await prisma.closedOrder.findMany({
                where: { userId: user.id },
                orderBy: { closedAt: "desc" },
            });

            const orders = closedOrders.map(order => ({
                orderId: order.orderId,
                userId: order.userId,
                asset: order.asset,
                orderType: order.orderType,
                leverage: order.leverage,
                status: "CLOSED",
                marginInt: order.marginInt.toString(),
                executionPriceInt: order.executionPriceInt.toString(),
                qtyInt: order.qtyInt.toString(),
                stopLossInt: order.stopLossInt.toString(),
                takeProfitInt: order.takeProfitInt.toString(),
                liquidationPriceInt: "0",
                finalPnLInt: order.finalPnLInt.toString(),
                closeReason: order.closeReason || null,
                margin: formatPrice(order.marginInt, 2),
                executionPrice: formatPrice(order.executionPriceInt, 2),
                liquidationPrice: "0.00",
                createdAt: order.createdAt,
                closedAt: order.closedAt,
            }));

            return res.json({
                success: true,
                orders,
                count: orders.length,
            });
        }

        // Open orders: query the engine
        const response = await engineClient.getUserOrders(
            user.id,
            status as "OPEN" | undefined
        );

        if(response.success) {
            const orders = response.data?.orders.map(order => ({
                ...order,
                marginInt: order?.marginInt.toString(),
                executionPriceInt: order?.executionPriceInt.toString(),
                qtyInt: order?.qtyInt.toString(),
                stopLossInt: order?.stopLossInt.toString(),
                takeProfitInt: order?.takeProfitInt.toString(),
                liquidationPriceInt: order?.liquidationPriceInt.toString(),
                finalPnLInt: order?.finalPnLInt.toString(),
                margin: formatPrice(order.marginInt, 2),
                executionPrice: formatPrice(order.executionPriceInt, 2),
                liquidationPrice: formatPrice(order.liquidationPriceInt, 2),
            }));

            return res.json({
                success: true,
                orders,
                count: response.data!.count,
            });
        }
        else {
            return res.status(400).json({
                error: response.error
            });
        }
    } catch(error: any) {
        console.error("Error fetching user orders:", error);
        
        if(error.message?.includes("timeout")) {
            return res.status(504).json({
                error: "Request timeout - engine may be unavailable"
            });
        }

        return res.status(500).json({
            error: "Internal server error",
        });
    }
};

/**
 * Get user balance 
 * GET /api/order/balance
 */

export const getBalance = async(req: authRequest, res: Response) => {
    try {
        const user = req.user;
        if(!user) {
            return res.status(401).json({
              error:  "User not authenticated"
            });
        }

        // Send request to engine
        const response = await engineClient.getBalance(user.id);

        if (response.success) {
            const balance = response.data?.balance;

            return res.json({
                success: true,
                balance: {
                    ...balance,
                    balanceInt: balance?.balanceInt.toString(),
                    balance: formatPrice(balance!.balanceInt, 2),
                },
            });
        } else {
            return res.status(400).json({
                error: response.error
            })
        }
    } catch(error: any) {
        console.error("Error fetching balance:", error);

        if (error.message?.includes("timeout")){
            return res.status(504).json({
                error: "Request timeout - engine may be unavailable"
            });
        }

        return res.status(500).json({
            error: "Internal server error"
        });
    }
}