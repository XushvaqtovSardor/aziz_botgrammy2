-- CreateEnum
CREATE TYPE "ChannelStatus" AS ENUM ('joined', 'requested', 'left');

-- CreateTable
CREATE TABLE "UserChannelStatus" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "status" "ChannelStatus" NOT NULL DEFAULT 'left',
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserChannelStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserChannelStatus_userId_idx" ON "UserChannelStatus"("userId");

-- CreateIndex
CREATE INDEX "UserChannelStatus_channelId_idx" ON "UserChannelStatus"("channelId");

-- CreateIndex
CREATE INDEX "UserChannelStatus_status_idx" ON "UserChannelStatus"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserChannelStatus_userId_channelId_key" ON "UserChannelStatus"("userId", "channelId");

-- AddForeignKey
ALTER TABLE "UserChannelStatus" ADD CONSTRAINT "UserChannelStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserChannelStatus" ADD CONSTRAINT "UserChannelStatus_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "MandatoryChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
