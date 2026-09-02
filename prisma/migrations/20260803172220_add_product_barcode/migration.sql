-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "barcode" TEXT;

-- CreateIndex
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");
