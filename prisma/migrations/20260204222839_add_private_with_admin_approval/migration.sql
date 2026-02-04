-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "ChannelType" ADD VALUE 'PRIVATE_WITH_ADMIN_APPROVAL';

-- CreateTable
CREATE TABLE "ChannelJoinRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "rejectedReason" TEXT,

    CONSTRAINT "ChannelJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChannelJoinRequest_userId_idx" ON "ChannelJoinRequest"("userId");

-- CreateIndex
CREATE INDEX "ChannelJoinRequest_channelId_idx" ON "ChannelJoinRequest"("channelId");

-- CreateIndex
CREATE INDEX "ChannelJoinRequest_status_idx" ON "ChannelJoinRequest"("status");

-- CreateIndex
CREATE INDEX "ChannelJoinRequest_telegramId_idx" ON "ChannelJoinRequest"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelJoinRequest_userId_channelId_key" ON "ChannelJoinRequest"("userId", "channelId");
