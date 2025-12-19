/** 
 * Redis Stream Types Package
 * Defines all message types for coomunication between HTTP-BACKEND and Liquidation Engine
*/


import type { Asset, OrderType, OrderStatus } from "@exness/prisma-client"

// -------------------------- Stream Names --------------------------

export const STREAMS = {
    REQUEST: "request:stream",
    RESPONSE: "response:stream",
    BATCH_UPLOADER: "batch:uploader:stream",
} as const;

// ------------------ Message Types -------------------
export type MessageType = 
|  "PRICE_UPDATE" 
| "REGISTER_USER"
| "PLACE_ORDER"
| "CLOSE_ORDER"
| "GET_BALANCE"
| "GET_ORDER"
| "GET_USER_ORDERS";

// Prevent PRICE_UPDATE from being used as a request type because PRICE_UPDATE is not a request.
export type RequestType = Exclude<MessageType, "PRICE_UPDATE">

// ------------------- Base Message Structures ---------------------------

export interface BaseStreamMessage<T = any> {
    type: MessageType;
    timestamp: number;
    payload: T
}

export interface StreamRequest<T = any> extends BaseStreamMessage<T>{
    requestId: string;
    type: RequestType;
    userId: string; 
}

export interface StreamResponse<T = any> {
    requestId: string;
    success: boolean;
    timestamp: number;
    data?: T;
    error?: string;
}


export interface StreamResponse<T = any> {
    requestId: string;
    success: boolean;
    timestamp: number;
    data?: T;
    error?: string;
}


// ----------------------------- Message Payloads -------------------------------
export interface RegisterUserPayload {
    initialBalanceInt: bigint; // Initial dummy balance (e.g., 100000000000 = 1000 USD)
}


// ---------------------------- Response Data -------------------------------

export interface BalanceData {
    balanceInt: bigint;
    userId: string;
}
export interface RegisterUserResponseData {
    balance: BalanceData
}

export interface PriceUpdateMessage extends BaseStreamMessage<PriceUpdatePayload>{
    type: "PRICE_UPDATE"
}

// ------------------------ Message Payloads -------------------------------
export interface PriceUpdatePayload {
    symbol: string; // e.g., "BTCUSDT"
    priceInt: bigint; // Manipulated price as integer (price * 100,000,000)
    timestamp: number // Unix timestamp in ms
}


// ------------------- Utility Functions -------------------------------

/*
Generate a unique request ID
*/
export function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2,11)}`;
}

/*
Create a price update message
*/

export function createPriceUpdate(
    symbol: string,
    priceInt: bigint,
    timestamp?: number
): PriceUpdateMessage {
    return {
        type: "PRICE_UPDATE",
        timestamp: timestamp || Date.now(),
        payload: {
            symbol,
            priceInt,
            timestamp: timestamp || Date.now(),
        }
    }
}


/**
 * Serialize BigInt values for JSON transmission
 */
export function serializeForStream(obj: any): string {
    return JSON.stringify(obj, (key, value) => 
        typeof value === "bigint" ? value.toString() : value
    );
}

/**
 * Deserialize BigInt values from JSON transmission
 */
export function deserializeFromStream (json: string): any {
    return JSON.parse(json, (key, value) => {
        // Convert string representations of bigints back to bigint
        if (
            typeof value === "string" &&
            /^-?\d+n?$/.test(value) && 
            key.toLowerCase().includes("int")
        ) {
            return BigInt(value.replace("n", ""));
        }
        return value;
    })
}

