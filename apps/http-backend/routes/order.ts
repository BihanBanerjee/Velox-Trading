import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { closeOrder, getBalance, getOrder, getUserOrders, openOrder } from "../controller/order.controller";
import {
  validateBody,
  validateParams,
  validateQuery,
  placeOrderSchema,
  closeOrderParamsSchema,
  getOrderParamsSchema,
  getUserOrdersQuerySchema
} from "@exness/validation";

export const orderRouter: Router = Router();

// Order operations
orderRouter.post("/open", authMiddleware, validateBody(placeOrderSchema), openOrder);
orderRouter.post("/close/:orderId", authMiddleware, validateParams(closeOrderParamsSchema), closeOrder);
// User queries (specific routes before parameterized routes)
orderRouter.get("/user/orders", authMiddleware, validateQuery(getUserOrdersQuerySchema), getUserOrders);
orderRouter.get("/user/balance", authMiddleware, getBalance);
orderRouter.get("/:orderId", authMiddleware, validateParams(getOrderParamsSchema), getOrder);