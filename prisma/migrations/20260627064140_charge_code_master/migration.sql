/*
  Warnings:

  - You are about to drop the column `isTaxable` on the `invoices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "chargeCodeId" TEXT,
ADD COLUMN     "isTaxable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "isTaxable";

-- CreateTable
CREATE TABLE "charge_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isTaxable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charge_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "charge_codes_code_key" ON "charge_codes"("code");

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_chargeCodeId_fkey" FOREIGN KEY ("chargeCodeId") REFERENCES "charge_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
