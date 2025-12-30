import redisClient from "@exness/redis-client";
import { BATCH_SIZE } from "./config";
import { STREAMS } from "@exness/redis-stream-types";
import { processBatch } from "./processor";


async function main() {
    console.log("Batch uploader started, waiting for data...");

    // Track last processed message ID
    let lastId = "$"; // Start from new messages

    // Cross-call batching variables
    let messageBuffer: [string, string[]][] = [];
    let lastFlushTime = Date.now();

    const TARGET_BATCH_SIZE = 100;
    const FLUSH_TIMEOUT_MS = 5000; // 5 seconds

    while (true) {
        try {
            // Read messages from the stream
            const messages = await redisClient.xread(
                "COUNT", BATCH_SIZE,
                "BLOCK", 1000, // Block for 1 second
                "STREAMS", STREAMS.REQUEST, lastId
            ) as [string, [string, string[]][]][] | null;

            if (messages && messages.length > 0) {
                const stream = messages[0];
                if (!stream) continue;

                const streamData: [string, string[]][] = stream[1]; // Array of [messageId, fields]
                console.log(`Received ${streamData.length} messages`);

                // Update lastId to the ID of the last message received
                const lastMessageId = streamData[streamData.length - 1]?.[0];
                if (!lastMessageId) continue;
                lastId = lastMessageId;

                // Add to buffer instead of processing immediately
                messageBuffer.push(...streamData);
                console.log(`Buffer now contains ${messageBuffer.length} messages`);

                // Check if we should flush the buffer
                const shouldFlushSize = messageBuffer.length >= TARGET_BATCH_SIZE;
                const shouldFlushTimeout = Date.now() - lastFlushTime > FLUSH_TIMEOUT_MS;

                if (shouldFlushSize || shouldFlushTimeout) {
                    console.log(`Flushing buffer: ${messageBuffer.length} messages (size: ${shouldFlushSize}, timeout: ${shouldFlushTimeout})`);

                    // Process the accumulated batch
                    await processBatch(messageBuffer);

                    // Reset buffer and timer
                    messageBuffer = [];
                    lastFlushTime = Date.now();
                }


            }
        } catch(error) {
            console.error("Error reading from stream:", error);
            await new Promise((res) => setTimeout(res, 1000)); // After we encounter an error reading from the stream, we will wait for 1 second before trying again.
        }
    }
    
}

main().catch(console.error);