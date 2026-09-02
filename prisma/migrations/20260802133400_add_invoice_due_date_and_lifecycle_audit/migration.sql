-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'INVOICE_FINALIZED';
ALTER TYPE "AuditAction" ADD VALUE 'INVOICE_PAYMENT_RECEIVED';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "dueDate" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'DRAFT';
