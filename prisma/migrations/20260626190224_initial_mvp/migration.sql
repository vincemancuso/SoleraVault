-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ADD', 'REMOVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bottle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetVolumeMl" DOUBLE PRECISION NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bottle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spirit" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "brand" TEXT,
    "producer" TEXT,
    "category" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "abvPercent" DOUBLE PRECISION NOT NULL,
    "proof" DOUBLE PRECISION NOT NULL,
    "ageYears" DOUBLE PRECISION,
    "cornPct" DOUBLE PRECISION,
    "ryePct" DOUBLE PRECISION,
    "wheatPct" DOUBLE PRECISION,
    "maltedBarleyPct" DOUBLE PRECISION,
    "otherGrainPct" DOUBLE PRECISION,
    "mashBillConfidence" DOUBLE PRECISION,
    "mashBillNotes" TEXT,
    "dataSource" TEXT,
    "sourceConfidence" DOUBLE PRECISION,
    "userVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Spirit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpiritFlavorProfile" (
    "id" TEXT NOT NULL,
    "spiritId" TEXT NOT NULL,
    "sweet" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vanilla" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "caramel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oak" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fruit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smoke" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nutty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "floral" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SpiritFlavorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleTransaction" (
    "id" TEXT NOT NULL,
    "bottleId" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "spiritId" TEXT,
    "amountMl" DOUBLE PRECISION NOT NULL,
    "transactionTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BottleTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleComponent" (
    "id" TEXT NOT NULL,
    "bottleId" TEXT NOT NULL,
    "spiritId" TEXT NOT NULL,
    "remainingVolumeMl" DOUBLE PRECISION NOT NULL,
    "remainingEthanolMl" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BottleComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BottleSnapshot" (
    "id" TEXT NOT NULL,
    "bottleId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "snapshotTime" TIMESTAMP(3) NOT NULL,
    "totalVolumeMl" DOUBLE PRECISION NOT NULL,
    "totalEthanolMl" DOUBLE PRECISION NOT NULL,
    "abvPercent" DOUBLE PRECISION NOT NULL,
    "proof" DOUBLE PRECISION NOT NULL,
    "componentBreakdownJson" JSONB NOT NULL,
    "categoryBreakdownJson" JSONB NOT NULL,
    "mashBillJson" JSONB NOT NULL,
    "flavorProfileJson" JSONB NOT NULL,

    CONSTRAINT "BottleSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Bottle_userId_idx" ON "Bottle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Spirit_canonicalName_key" ON "Spirit"("canonicalName");

-- CreateIndex
CREATE INDEX "Spirit_category_idx" ON "Spirit"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SpiritFlavorProfile_spiritId_key" ON "SpiritFlavorProfile"("spiritId");

-- CreateIndex
CREATE INDEX "BottleTransaction_bottleId_transactionTime_idx" ON "BottleTransaction"("bottleId", "transactionTime");

-- CreateIndex
CREATE UNIQUE INDEX "BottleComponent_bottleId_spiritId_key" ON "BottleComponent"("bottleId", "spiritId");

-- CreateIndex
CREATE UNIQUE INDEX "BottleSnapshot_transactionId_key" ON "BottleSnapshot"("transactionId");

-- CreateIndex
CREATE INDEX "BottleSnapshot_bottleId_snapshotTime_idx" ON "BottleSnapshot"("bottleId", "snapshotTime");

-- AddForeignKey
ALTER TABLE "Bottle" ADD CONSTRAINT "Bottle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spirit" ADD CONSTRAINT "Spirit_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpiritFlavorProfile" ADD CONSTRAINT "SpiritFlavorProfile_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "Spirit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleTransaction" ADD CONSTRAINT "BottleTransaction_bottleId_fkey" FOREIGN KEY ("bottleId") REFERENCES "Bottle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleTransaction" ADD CONSTRAINT "BottleTransaction_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "Spirit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleComponent" ADD CONSTRAINT "BottleComponent_bottleId_fkey" FOREIGN KEY ("bottleId") REFERENCES "Bottle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleComponent" ADD CONSTRAINT "BottleComponent_spiritId_fkey" FOREIGN KEY ("spiritId") REFERENCES "Spirit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleSnapshot" ADD CONSTRAINT "BottleSnapshot_bottleId_fkey" FOREIGN KEY ("bottleId") REFERENCES "Bottle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BottleSnapshot" ADD CONSTRAINT "BottleSnapshot_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "BottleTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
