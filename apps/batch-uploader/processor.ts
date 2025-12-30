import redisClient from "@exness/redis-client";
import { prisma } from "@exness/prisma-client";
import { STREAMS } from "@exness/redis-stream-types";
import type { PriceData } from "./types";
import { toInteger } from "@exness/price-utils";


export async function processBatch(streamData: [string, string[]][]) {
    const trades: PriceData[] = [];
    const messageIds: string[] = [];

    // Parse each message from the stream
    for (const [messageId, fields] of streamData) {
        /* This is how streamData looks like from request:stream:
        [
            ["messageId-1", ["type", "PRICE_UPDATE", "timestamp", "1234567890", "payload", "{...}"]],
            ["messageId-2", ["type", "PLACE_ORDER", "userId", "user123", "payload", "{...}"]],
        ]
        We only process PRICE_UPDATE messages and extract honest price/quantity from payload.
        */
        try {
            // Parse Redis stream key-value pairs into a map
            const fieldMap: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
                const key = fields[i];
                const value = fields[i + 1];
                if (key && value) {
                    fieldMap[key] = value;
                }
            }

            // Filter: only process PRICE_UPDATE messages (skip order requests)
            if (fieldMap.type !== "PRICE_UPDATE") {
                continue;
            }

            // Extract payload with honest price and quantity
            if (fieldMap.payload) {
                const payload = JSON.parse(fieldMap.payload);
                const { symbol, honestPriceInt, honestQtyInt, timestamp } = payload;

                // Convert BigInt back to decimal strings for PriceData format
                trades.push({
                    price: (Number(BigInt(honestPriceInt)) / 100_000_000).toString(),
                    quantity: (Number(BigInt(honestQtyInt)) / 100_000_000).toString(),
                    timestamp,
                    symbol
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
                qtyInt: toInteger(parseFloat(trade.quantity)) // Convert to BigInt integer
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
    
    // Trim old messages from the stream (keep last 10000 messages)
    if (messageIds.length > 0) {
        try {
            await redisClient.xtrim(STREAMS.REQUEST, "MAXLEN", "~", 10000);
            console.log(`Processed ${messageIds.length} messages, stream trimmed`);
        } catch (error) {
            console.error("Error trimming stream:", error);
        }
    }

}