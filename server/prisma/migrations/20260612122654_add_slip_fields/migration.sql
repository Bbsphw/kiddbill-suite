-- AlterTable
ALTER TABLE "BillMember" ADD COLUMN     "slipAmount" DECIMAL(10,2),
ADD COLUMN     "slipMatchStatus" TEXT,
ADD COLUMN     "slipRefId" TEXT,
ADD COLUMN     "slipSender" TEXT;
