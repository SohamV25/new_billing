/*
  Warnings:

  - Made the column `discount` on table `InvoiceItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "InvoiceItem" ALTER COLUMN "discount" SET NOT NULL;
