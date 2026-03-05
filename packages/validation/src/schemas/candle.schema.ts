import { z } from "zod";
import { assetSchema } from "./common.schema";

// Supported candle durations
export const candleDurationSchema = z.enum(["30s", "1m", "5m", "15m", "1h", "4h", "1d"], {
  message: "Duration must be one of: 30s, 1m, 5m, 15m, 1h, 4h, 1d"
});

// Candle query parameters
export const candleQuerySchema = z.object({
  asset: assetSchema,
  duration: candleDurationSchema
});

// Export inferred types
export type CandleQuery = z.infer<typeof candleQuerySchema>;
export type CandleDuration = z.infer<typeof candleDurationSchema>;
