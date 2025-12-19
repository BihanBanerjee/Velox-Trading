-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'CLOSED', 'LIQUIDATED');

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "time" TIMESTAMPTZ NOT NULL,
    "symbol" TEXT NOT NULL,
    "priceInt" BIGINT NOT NULL,
    "qtyInt" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id","time")
);

-- CreateIndex
CREATE INDEX "trades_symbol_time_idx" ON "trades"("symbol", "time");

-- CreateIndex
CREATE INDEX "trades_time_idx" ON "trades"("time");
