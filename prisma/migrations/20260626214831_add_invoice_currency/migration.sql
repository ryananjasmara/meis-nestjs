-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('IDR', 'USD');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'IDR',
ADD COLUMN     "exchangeRate" DECIMAL(18,6) NOT NULL DEFAULT 1;
