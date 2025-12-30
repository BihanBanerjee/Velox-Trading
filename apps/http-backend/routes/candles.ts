import { Router } from "express";
import { getCandles } from "../controller/candles.controller";
import { validateQuery, candleQuerySchema } from "@exness/validation";

export const candleRouter: Router = Router();
candleRouter.get("/", validateQuery(candleQuerySchema), getCandles);