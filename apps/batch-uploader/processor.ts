import redisClient from "@exness/redis-client";
import { prisma } from "@exness/prisma-client";
import { BATCH_UPLOADER_STREAM, CONSUMER_GROUP } from "./config";
import type { PriceData } from "./types";
import { toInteger } from "@exness/price-utils";


export async function processBatch(streamData: any[]) {
    const trades: PriceData[] = [];
    const messageIds: string[] = [];

    // Parse each message from the stream
    for (const [messageId, fields] of streamData) {
        /* This is how streamData looks like:-> an array of arrays.
        [
            ["messageId-1", ["data", "{\"price\":\"50000\",\"quantity\":\"0.5\",\"timestamp\":1234567890,\"symbol\":\"BTCUSDT\"}", "other_field", "value"]],
            ["messageId-2", ["data", "{\"price\":\"50001\",\"quantity\":\"0.3\",\"timestamp\":1234567891,\"symbol\":\"BTCUSDT\"}"]],
  // ... more messages
        ]

        */
        try {
            // Redis stream format: [messageId, ["data", "JSON_STRING"]]
            const dataIndex = fields.indexOf("data");
            if(dataIndex !== -1 && fields[dataIndex + 1]) {
                const tradeData = JSON.parse(fields[dataIndex + 1]);
                trades.push({
                    price: tradeData.price,
                    quantity: tradeData.quantity,
                    timestamp: tradeData.timestamp,
                    symbol: tradeData.symbol
                });
                messageIds.push(messageId);
            }
        } catch (error) {
            console.error(`Error parsing message ${messageId}:`, error)
        }

    }
    console.log(`Parsed ${trades.length} valid trades`);
    console.log("Sample trades:", trades.slice(0,3)); // show first 3 trades

    // Insert trades to TimescaleDB via prisma
    if (trades.length > 0) {
        try {
            const insertData = trades.map( trade => ({
                time: new Date(trade.timestamp),
                symbol: trade.symbol,
                priceInt: toInteger(parseFloat(trade.price)), // Convert to BigInt integer
                qtyInt: toInteger(parseFloat(trade.quantity)) // Conver to BigInt integer
            }));
            await prisma.trade.createMany({
                data: insertData,
                skipDuplicates: true // Skip if duplicate composite key [id, time]  
            });

            console.log(`Successfully inserted ${trades.length} trades to database`);
            
        } catch (error) {
            console.error("Error inserting trades to database:", error);
            return;
        }
    }
    
    // Acknowledge processed messages
    if (messageIds.length > 0) {
        try {
            await redisClient.xack(BATCH_UPLOADER_STREAM, CONSUMER_GROUP, ...messageIds);
            console.log(`Acknowledged ${messageIds.length} messages`);
        } catch (error) {
            console.error("Error acknowledging messages:", error);
        }
    }
    
}