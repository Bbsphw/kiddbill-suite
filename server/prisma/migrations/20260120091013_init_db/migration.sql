-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('DRAFT', 'OCR_PROCESSING', 'SPLITTING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoundingMode" AS ENUM ('NONE', 'UP', 'DOWN', 'NEAREST');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('FOOD', 'BEVERAGE', 'ALCOHOL', 'DISCOUNT', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatarUrl" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBankAccount" (
    "id" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Bill',
    "note" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "receiptUrl" TEXT,
    "rawOcrData" JSONB,
    "joinCode" TEXT NOT NULL,
    "passcode" TEXT,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 7.00,
    "serviceChargeRate" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "isVatIncluded" BOOLEAN NOT NULL DEFAULT true,
    "isServiceChargeIncluded" BOOLEAN NOT NULL DEFAULT false,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "roundingMode" "RoundingMode" NOT NULL DEFAULT 'NONE',
    "promptPayNumber" TEXT,
    "promptPayName" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "status" "BillStatus" NOT NULL DEFAULT 'DRAFT',
    "deletedAt" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "payerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillItem" (
    "id" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "type" "ItemType" NOT NULL DEFAULT 'FOOD',
    "applyVat" BOOLEAN NOT NULL DEFAULT true,
    "applyServiceCharge" BOOLEAN NOT NULL DEFAULT true,
    "billId" TEXT NOT NULL,

    CONSTRAINT "BillItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paymentProofUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "netAmountToPay" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "userId" TEXT,
    "billId" TEXT NOT NULL,

    CONSTRAINT "BillMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemSplit" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    "fixedAmount" DECIMAL(10,2),

    CONSTRAINT "ItemSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Friend_userId_nickname_key" ON "Friend"("userId", "nickname");

-- CreateIndex
CREATE UNIQUE INDEX "UserBankAccount_userId_accountNumber_key" ON "UserBankAccount"("userId", "accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_joinCode_key" ON "Bill"("joinCode");

-- CreateIndex
CREATE INDEX "Bill_joinCode_idx" ON "Bill"("joinCode");

-- CreateIndex
CREATE INDEX "Bill_ownerId_idx" ON "Bill"("ownerId");

-- CreateIndex
CREATE INDEX "BillItem_billId_idx" ON "BillItem"("billId");

-- CreateIndex
CREATE UNIQUE INDEX "BillMember_billId_userId_key" ON "BillMember"("billId", "userId");

-- CreateIndex
CREATE INDEX "ItemSplit_itemId_idx" ON "ItemSplit"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemSplit_itemId_memberId_key" ON "ItemSplit"("itemId", "memberId");

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBankAccount" ADD CONSTRAINT "UserBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillItem" ADD CONSTRAINT "BillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillMember" ADD CONSTRAINT "BillMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillMember" ADD CONSTRAINT "BillMember_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSplit" ADD CONSTRAINT "ItemSplit_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "BillItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemSplit" ADD CONSTRAINT "ItemSplit_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "BillMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
