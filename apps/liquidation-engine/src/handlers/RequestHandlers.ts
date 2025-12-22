/**
 * Request Handler
 * Process all incoming requests from the http-server via Redis streams
 * Updates in-memory state and returns responses
 */

import redisClient from "@exness/redis-client";
import type { StateManager } from "../state/StateManager";
import type Redis from 'ioredis';
import { createErrorResponse, 
    createSuccessResponse, 
    ErrorCode, 
    type PlaceOrderPayload, 
    type PlaceOrderResponseData, 
    type SignupUserPayload, 
    type signupUserResponseData, 
    type StreamRequest, 
    type StreamResponse 
} from "@exness/redis-stream-types";
import { formatPrice, isValidPrice, isValidQuantity, toInteger } from "@exness/price-utils";
import { isValidLeverage } from "../utils/liquidation";

export class RequestHandler {
    constructor(
        private state: StateManager,
        private priceRedis: Redis = redisClient
    ) {}

    /**
     * Main request router - handles all request types
     */

    async handleRequest(request: StreamRequest): Promise<StreamResponse> {
        try{
            switch(request.type) {
                case "REGISTER_USER":
            }
        } catch(error) {

        }
    }

    /**
     * Handle REGISTER_USER request
     */

    private async handleRegisterUser(
        request: StreamRequest<SignupUserPayload>
    ): Promise<StreamResponse<signupUserResponseData>> {
        const { userId, payload, requestId } = request;
        const { initialBalanceInt } = payload;

        // Check if user already exists
        const existingUser = this.state.getUser(userId);
        if (existingUser) {
            return createErrorResponse(
                requestId,
                `User ${userId} already registered in liquidation engine`
            );
        }

        // Initialize user with dummy balance
        this.state.setUser(userId, initialBalanceInt);

        console.log(
            `User registered: ${userId} | Initial Balance: ${formatPrice(initialBalanceInt)}`
        );

        return createSuccessResponse<signupUserResponseData>(
            requestId,
            {
                balance: {
                    balanceInt: initialBalanceInt,
                    userId,
                },
            });
    }

    /**
     * Handle PLACE_ORDER request
     */
    private async handlePlaceOrder(
        request: StreamRequest<PlaceOrderPayload>
    ): Promise<StreamResponse<PlaceOrderResponseData>> {
        const { userId, payload, requestId } = request;
        const { orderType, asset, leverage, qty, stopLoss, takeProfit } = payload;

        // Validate leverage
        if(!isValidLeverage(leverage)) {
            return createErrorResponse(
                requestId,
                `${ErrorCode.INVALID_LEVERAGE}: Leverage must be between 1 and 100`
            );
        }

        // Validate quantity
        if (qty <=0) {
            return createErrorResponse(
                requestId,
                `${ErrorCode.INVALID_QUANTITY}: Quantity must be positive`
            );
        }

        // Get current price from Redis
        const currData = await this.priceRedis.get(`market:${asset}`);
        if(!currData) {
            return createErrorResponse(
                requestId,
                `${ErrorCode.PRICE_DATA_UNAVAILABLE}: Price data not available for ${asset}`
            );
        }

        const parsed = JSON.parse(currData);
        const executionPrice = orderType === "LONG" ? parsed.askPrice : parsed.bidPrice;

        // Convert to integers
        const executionPriceInt = toInteger(executionPrice);
        const qtyInt = toInteger(qty);

        // Validate price
        if(!isValidPrice(executionPrice)) {
            return createErrorResponse(
                requestId,
                `${ErrorCode.INVALID_PRICE}: Invalid execution price`
            )
        }

        // Validate quantity
        if(!isValidQuantity(qtyInt)) {
            return createErrorResponse(
                requestId,
                `${ErrorCode.INVALID_QUANTITY}: Invalid quantity`
            )
        }

        // One question --> isValidPrice and isValidQuantity coming from price-utils but isValidLeverage is coming from utils/liquidation ? Should we move isValidLeverage to price-utils for consistency?

        // Calculate Volume and Margin

    }


}

