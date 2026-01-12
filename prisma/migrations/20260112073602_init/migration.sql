-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPERADMIN', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('UZ', 'RU', 'EN');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('MOVIE', 'SERIAL');

-- CreateEnum
CREATE TYPE "BroadcastType" AS ENUM ('AD', 'NOTIFICATION', 'ALL', 'PREMIUM', 'FREE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('PUBLIC', 'PRIVATE', 'EXTERNAL');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "language" "Language" NOT NULL DEFAULT 'UZ',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumTill" TIMESTAMP(3),
    "premiumExpiresAt" TIMESTAMP(3),
    "hasTelegramPremium" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedAt" TIMESTAMP(3),
    "blockReason" TEXT,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "premiumBanCount" INTEGER NOT NULL DEFAULT 0,
    "isPremiumBanned" BOOLEAN NOT NULL DEFAULT false,
    "premiumBannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" SERIAL NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "canAddAdmin" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteContent" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelLink" TEXT,
    "databaseChannelId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseChannel" (
    "id" SERIAL NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "channelLink" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatabaseChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandatoryChannel" (
    "id" SERIAL NOT NULL,
    "type" "ChannelType" NOT NULL DEFAULT 'PUBLIC',
    "channelId" TEXT,
    "channelName" TEXT NOT NULL,
    "channelLink" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "memberLimit" INTEGER,
    "currentMembers" INTEGER NOT NULL DEFAULT 0,
    "pendingRequests" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MandatoryChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "posterFileId" TEXT NOT NULL,
    "videoFileId" TEXT,
    "videoMessageId" TEXT,
    "channelMessageId" INTEGER,
    "genre" TEXT,
    "language" TEXT,
    "quality" TEXT,
    "description" TEXT,
    "year" INTEGER,
    "imdb" DOUBLE PRECISION,
    "duration" INTEGER,
    "fieldId" INTEGER NOT NULL,
    "totalEpisodes" INTEGER NOT NULL DEFAULT 1,
    "views" INTEGER NOT NULL DEFAULT 0,
    "shareLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovieEpisode" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "videoFileId" TEXT NOT NULL,
    "videoMessageId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovieEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Serial" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "posterFileId" TEXT NOT NULL,
    "channelMessageId" INTEGER,
    "description" TEXT,
    "genre" TEXT,
    "totalEpisodes" INTEGER NOT NULL DEFAULT 0,
    "hasCustomChannel" BOOLEAN NOT NULL DEFAULT false,
    "customChannelId" TEXT,
    "customChannelLink" TEXT,
    "fieldId" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "shareLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Serial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "serialId" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "videoFileId" TEXT NOT NULL,
    "videoMessageId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "movieId" INTEGER,
    "serialId" INTEGER,
    "episodeId" INTEGER,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "receiptFileId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL DEFAULT 'payme',
    "transactionId" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PremiumSettings" (
    "id" SERIAL NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "threeMonthPrice" DOUBLE PRECISION NOT NULL,
    "sixMonthPrice" DOUBLE PRECISION NOT NULL,
    "yearlyPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "cardNumber" TEXT NOT NULL,
    "cardHolder" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremiumSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotSettings" (
    "id" SERIAL NOT NULL,
    "aboutBot" TEXT NOT NULL,
    "contactMessage" TEXT,
    "supportUsername" TEXT NOT NULL,
    "adminNotificationChat" TEXT NOT NULL,
    "welcomeMessage" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" SERIAL NOT NULL,
    "type" "BroadcastType" NOT NULL,
    "messageText" TEXT NOT NULL,
    "mediaFileId" TEXT,
    "fromChatId" TEXT,
    "fromMessageId" INTEGER,
    "status" "BroadcastStatus" NOT NULL DEFAULT 'PENDING',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_telegramId_idx" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "User_isPremium_idx" ON "User"("isPremium");

-- CreateIndex
CREATE INDEX "User_hasTelegramPremium_idx" ON "User"("hasTelegramPremium");

-- CreateIndex
CREATE INDEX "User_isPremiumBanned_idx" ON "User"("isPremiumBanned");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_telegramId_key" ON "Admin"("telegramId");

-- CreateIndex
CREATE INDEX "Admin_telegramId_idx" ON "Admin"("telegramId");

-- CreateIndex
CREATE INDEX "Admin_role_idx" ON "Admin"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Field_name_key" ON "Field"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Field_channelId_key" ON "Field"("channelId");

-- CreateIndex
CREATE INDEX "Field_channelId_idx" ON "Field"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "DatabaseChannel_channelId_key" ON "DatabaseChannel"("channelId");

-- CreateIndex
CREATE INDEX "DatabaseChannel_channelId_idx" ON "DatabaseChannel"("channelId");

-- CreateIndex
CREATE INDEX "MandatoryChannel_isActive_idx" ON "MandatoryChannel"("isActive");

-- CreateIndex
CREATE INDEX "MandatoryChannel_type_idx" ON "MandatoryChannel"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_code_key" ON "Movie"("code");

-- CreateIndex
CREATE INDEX "Movie_code_idx" ON "Movie"("code");

-- CreateIndex
CREATE INDEX "Movie_fieldId_idx" ON "Movie"("fieldId");

-- CreateIndex
CREATE INDEX "Movie_views_idx" ON "Movie"("views");

-- CreateIndex
CREATE INDEX "MovieEpisode_movieId_idx" ON "MovieEpisode"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "MovieEpisode_movieId_episodeNumber_key" ON "MovieEpisode"("movieId", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Serial_code_key" ON "Serial"("code");

-- CreateIndex
CREATE INDEX "Serial_code_idx" ON "Serial"("code");

-- CreateIndex
CREATE INDEX "Serial_fieldId_idx" ON "Serial"("fieldId");

-- CreateIndex
CREATE INDEX "Episode_serialId_idx" ON "Episode"("serialId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_serialId_episodeNumber_key" ON "Episode"("serialId", "episodeNumber");

-- CreateIndex
CREATE INDEX "WatchHistory_userId_idx" ON "WatchHistory"("userId");

-- CreateIndex
CREATE INDEX "WatchHistory_watchedAt_idx" ON "WatchHistory"("watchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Broadcast_createdAt_idx" ON "Broadcast"("createdAt");

-- CreateIndex
CREATE INDEX "Broadcast_status_idx" ON "Broadcast"("status");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_databaseChannelId_fkey" FOREIGN KEY ("databaseChannelId") REFERENCES "DatabaseChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieEpisode" ADD CONSTRAINT "MovieEpisode_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Serial" ADD CONSTRAINT "Serial_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_serialId_fkey" FOREIGN KEY ("serialId") REFERENCES "Serial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_serialId_fkey" FOREIGN KEY ("serialId") REFERENCES "Serial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
