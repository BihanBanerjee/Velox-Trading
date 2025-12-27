/*
  Warnings:

  - You are about to drop the column `executionPoint` on the `closed_orders` table. All the data in the column will be lost.
  - Added the required column `executionPriceInt` to the `closed_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "closed_orders" DROP COLUMN "executionPoint",
ADD COLUMN     "executionPriceInt" BIGINT NOT NULL;
