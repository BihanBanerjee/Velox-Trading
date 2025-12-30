import { z } from "zod";
import {
  assetSchema,
  orderTypeSchema,
  orderStatusSchema,
  orderIdSchema,
  leverageSchema,
  quantitySchema,
  priceSchema
} from "./common.schema";

// Place order request body
export const placeOrderSchema = z.object({
  orderType: orderTypeSchema,
  asset: assetSchema,
  leverage: leverageSchema,
  qty: quantitySchema,
  stopLoss: priceSchema.optional(),
  takeProfit: priceSchema.optional()
});

// Close order params
export const closeOrderParamsSchema = z.object({
  orderId: orderIdSchema
});

// Get order params
export const getOrderParamsSchema = z.object({
  orderId: orderIdSchema
});

// Get user orders query
export const getUserOrdersQuerySchema = z.object({
  status: orderStatusSchema.optional()
}).partial();

// Export inferred types
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type CloseOrderParams = z.infer<typeof closeOrderParamsSchema>;
export type GetOrderParams = z.infer<typeof getOrderParamsSchema>;
export type GetUserOrdersQuery = z.infer<typeof getUserOrdersQuerySchema>;
