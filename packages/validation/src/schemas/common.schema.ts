import { z } from "zod";
import type { Asset, OrderType, OrderStatus } from "@exness/prisma-client";

// Prisma enum validators
export const assetSchema = z.enum(["BTCUSDT", "ETHUSDT", "SOLUSDT"], {
  message: "Asset must be BTCUSDT, ETHUSDT, or SOLUSDT"
}) as z.ZodType<Asset>;

export const orderTypeSchema = z.enum(["LONG", "SHORT"], {
  message: "Order type must be LONG or SHORT"
}) as z.ZodType<OrderType>;

export const orderStatusSchema = z.enum(["OPEN", "CLOSED", "LIQUIDATED"], {
  message: "Status must be OPEN, CLOSED, or LIQUIDATED"
}) as z.ZodType<OrderStatus>;

// UUID validator with custom error
export const uuidSchema = z.string().refine(
  (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val),
  { message: "Invalid UUID format" }
);

// Order ID validator (custom format: ord_<timestamp>_<random>)
export const orderIdSchema = z.string().refine(
  (val) => /^ord_\d+_[a-z0-9]+$/i.test(val),
  { message: "Invalid order ID format" }
);

// BigInt string validator (for JSON serialization)
export const bigIntStringSchema = z.string().regex(/^\d+$/, {
  message: "Must be a valid BigInt string"
}).transform(val => BigInt(val));

// Price validator (positive number or bigint string)
export const priceSchema = z.number().positive({
  message: "Price must be a positive number"
}).or(bigIntStringSchema);

// Leverage validator (1-100, integer)
export const leverageSchema = z.number()
  .int({ message: "Leverage must be an integer" })
  .min(1, { message: "Leverage must be at least 1" })
  .max(100, { message: "Leverage cannot exceed 100" });

// Quantity validator
export const quantitySchema = z.number().positive({
  message: "Quantity must be positive"
});
