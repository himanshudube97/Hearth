-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'dev',
    "profile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lemonSqueezyCustomerId" TEXT,
    "subscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "variantId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "e2eeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "encryptedMasterKey" TEXT,
    "masterKeyIV" TEXT,
    "masterKeySalt" TEXT,
    "recoveryKeyHash" TEXT,
    "encryptedMasterKeyRecovery" TEXT,
    "recoveryKeyIV" TEXT,
    "e2eeSetupAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textPreview" TEXT,
    "mood" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "song" TEXT,
    "entryType" TEXT NOT NULL DEFAULT 'normal',
    "unlockDate" TIMESTAMP(3),
    "isSealed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "style" JSONB,
    "userId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientName" TEXT,
    "senderName" TEXT,
    "letterLocation" TEXT,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "isReceivedLetter" BOOLEAN NOT NULL DEFAULT false,
    "originalSenderId" TEXT,
    "originalEntryId" TEXT,
    "encryptionType" TEXT NOT NULL DEFAULT 'server',
    "e2eeIV" TEXT,
    "spreads" INTEGER NOT NULL DEFAULT 1,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doodles" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "strokes" JSONB NOT NULL,
    "positionInEntry" INTEGER NOT NULL DEFAULT 0,
    "spread" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doodles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_photos" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "spread" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "rotation" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entry_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_quotes" (
    "id" TEXT NOT NULL,
    "quoteText" TEXT NOT NULL,
    "bookTitle" TEXT NOT NULL,
    "author" TEXT,
    "mood" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whispers" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'generic',

    CONSTRAINT "whispers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_lemonSqueezyCustomerId_key" ON "users"("lemonSqueezyCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "users_subscriptionId_key" ON "users"("subscriptionId");

-- CreateIndex
CREATE INDEX "journal_entries_userId_createdAt_idx" ON "journal_entries"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "journal_entries_userId_mood_idx" ON "journal_entries"("userId", "mood");

-- CreateIndex
CREATE INDEX "journal_entries_userId_createdAt_mood_idx" ON "journal_entries"("userId", "createdAt", "mood");

-- CreateIndex
CREATE INDEX "journal_entries_unlockDate_isDelivered_idx" ON "journal_entries"("unlockDate", "isDelivered");

-- CreateIndex
CREATE INDEX "journal_entries_userId_isArchived_idx" ON "journal_entries"("userId", "isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "doodles_journalEntryId_spread_key" ON "doodles"("journalEntryId", "spread");

-- CreateIndex
CREATE UNIQUE INDEX "entry_photos_entryId_spread_position_key" ON "entry_photos"("entryId", "spread", "position");

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doodles" ADD CONSTRAINT "doodles_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_photos" ADD CONSTRAINT "entry_photos_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
