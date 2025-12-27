import { prisma } from "@exness/prisma-client";
import redisClient from "@exness/redis-client";
import { getLatestStreamId } from "@exness/redis-client/stream";
import { deserializeFromStream, STREAMS, type CloseOrderResponseData, type StreamResponse } from "@exness/redis-stream-types";

/**
 * DB Worker
 * 
 * Purpose: Persist closed orders to PostgresSQL for historical display on frontend
 * 
 * Architecture:
 * - Listens to response:stream using simple XREAD (single worker instances)
 * - Filters for CLOSE_ORDER responses (both manual and auto-liquidation)
 * - Inserts closed orders into ClosedOrder table.
 * - Runs independently without blocking liquidation engine
 * 
 * Handles:
 * - Manual order closures (user-initiated)
 * - Auto-liquidations (margin-call, stop-loss, take-profit)
 */

// Track current stream position
let currentStreamId = "0-0";

async function processCloseOrderResponse(
    response: StreamResponse<CloseOrderResponseData>
) {
    if (!response.success || !response.data) {
        // Failed responses don't need persistence
        return;
    }

    const { order } = response.data;

    try{
        // Calculate close price from P&L
        // Formula: For LONG: PnL = (closePrice - executionPrice) * qty * leverage
        //          For SHORT: PnL = (executionPrice - closePrice) * qty * leverage
        // Solving for closePrice:
        //   LONG: closePrice = executionPrice + (PnL / (qty * leverage))
        //   SHORT: closePrice = executionPrice - (PnL / (qty * leverage))

        const denominator = order.qtyInt * BigInt(order.leverage)
        const pnlPerUnit = denominator > 0n ? order.finalPnLInt / denominator : 0n;
        const closePriceInt = order.orderType === 'LONG'
        ? order.executionPriceInt + pnlPerUnit
        : order.executionPriceInt - pnlPerUnit;

        // Insert closed order into database.
        await prisma.closedOrder.create({
            data: {
                orderId: order.orderId,
                userId: order.userId,
                asset: order.asset as any, // Enum: BTCUSDT, ETHUSDT, SOLUSDT
                orderType: order.orderType as any, // Enum: LONG, SHORT
                leverage: order.leverage,
                marginInt: order.marginInt,
                executionPriceInt: order.executionPriceInt,
                closePriceInt: closePriceInt,
                qtyInt: order.qtyInt,
                stopLossInt: order.stopLossInt,
                takeProfitInt: order.takeProfitInt,
                finalPnLInt: order.finalPnLInt,
                createdAt: new Date(order.createdAt),
                closedAt: new Date(),
            }
        });

        console.log(`[DB Persist] ✓ Closed order saved: ${order.orderId}`);
        console.log(`  ├─ User: ${order.userId}`);
        console.log(`  ├─ Type: ${order.orderType}`);
        console.log(`  ├─ Asset: ${order.asset}`);
        console.log(`  └─ P&L: ${order.finalPnLInt > 0 ? '+' : ''}${(Number(order.finalPnLInt) / 1e8).toFixed(2)}`);
    } catch(error) {
        console.error(`[DB Persist Error] Failed to persist order ${order.orderId}:`, error);
        // Don't throw - we don't want to crash the worker on DB errors
        // The data is still in Redis stream and can be reprocessed
    }
}

async function startResponseConsumer() {
    console.log(`[DB Worker] Starting response stream consumer...`);
    console.log(`  ├─ Stream: ${STREAMS.RESPONSE}`);
    console.log(`  └─ Starting from: ${currentStreamId}`);

    // Consume stream indefinitely
    while(true) {
        try {
            const results = (await redisClient.call(
                "XREAD",
                "BLOCK", "5000", // Block for 5 seconds
                "COUNT", "10", // Process up to 10 message at once
                "STREAMS",
                STREAMS.RESPONSE,
                currentStreamId
            )) as [string, [string, string[]][]][] | null;

            if (!results || results.length === 0) {
                continue;
            }

            // Process each message 
            for(const [_streamName, messages] of results) {
                for (const [streamId, fields] of messages){
                    try {
                        // Parse the message fields
                        const fieldMap: Record<string, string> = {};
                        for(let i = 0; i < fields.length; i+= 2) {
                            const key = fields[i];
                            const value = fields[i + 1];
                            if (key !== undefined && value !== undefined) {
                                fieldMap[key] = value;
                            }
                        }

                        if(fieldMap.data) {
                            const response = deserializeFromStream(fieldMap.data) as StreamResponse<any>;

                            // Only process CLOSE_ORDER responses
                            // Check if the responses has the expected structure for closed orders

                            if(response.success && response.data && 'order' in response.data && 'balance' in response.data) {
                                const closeOrderResponse = response as StreamResponse<CloseOrderResponseData>;

                                // Check if order has finalPnLInt (indicator of a closed order)
                                if(closeOrderResponse.data?.order?.finalPnLInt !== undefined) {
                                    await processCloseOrderResponse(closeOrderResponse)
                                }
                            }
                        }

                        // Update current stream ID for next read
                        currentStreamId = streamId;
                    } catch (error) {
                        console.error(`[DB Worker] Error processing message ${streamId}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error("[DB Worker] Error reading from stream", error );
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }
}

async function main() {
    console.log("=== DB Worker Starting ===");
    console.log(`PID: ${process.pid}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log("");

    try {
        // Test database connection
        await prisma.$connect();
        console.log("[DB Worker] - connected to PostgresSQL");
        
        // Test Redis Connection
        await redisClient.ping();
        console.log("[DB Worker] - connected to Redis");
        
        // Initialize stream position (start from latest)
        currentStreamId = await getLatestStreamId(redisClient, STREAMS.RESPONSE);
        console.log(`[DB Worker] - Initialized at stream ID: ${currentStreamId}`);
        console.log("");

        // Start consuming response stream
        await startResponseConsumer();

        console.log("[DB Worker] - Ready to persist closed orders");
        console.log("");
    } catch (error) {
        console.error("[DB Worker] Initialization failed:", error);
        process.exit(1);
    }
}


// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("\n[DB Worker] Received SIGTERM, shutting down gracefully...");
    await prisma.$disconnect();
    await redisClient.quit()
    console.log("[DB Worker] -> Shutdown complete");
    process.exit(0);
})

process.on("SIGINT", async () => {
    console.log("\n[DB Worker] Received SIGINT, shutting down gracefully...");
    await prisma.$disconnect();
    await redisClient.quit();
    console.log("[DB Worker] -> Shutdown complete");
    process.exit(0);
})

// Start the worker
main();