import { z } from "zod";
import { assetSchema } from "./common.schema";

// Supported candle durations
export const candleDurationSchema = z.enum(["1m", "2m", "5m", "10m", "1d"], {
  message: "Duration must be one of: 1m, 2m, 5m, 10m, 1d"
});

// Candle query parameters
export const candleQuerySchema = z.object({
  asset: assetSchema,
  duration: candleDurationSchema
});

// Export inferred types
export type CandleQuery = z.infer<typeof candleQuerySchema>;
export type CandleDuration = z.infer<typeof candleDurationSchema>;
