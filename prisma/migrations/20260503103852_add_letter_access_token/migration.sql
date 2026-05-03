-- CreateTable
CREATE TABLE "letter_access_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "readsRemaining" INTEGER NOT NULL DEFAULT 3,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "firstReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "letter_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "letter_access_tokens_token_key" ON "letter_access_tokens"("token");

-- CreateIndex
CREATE INDEX "letter_access_tokens_letterId_idx" ON "letter_access_tokens"("letterId");

-- AddForeignKey
ALTER TABLE "letter_access_tokens" ADD CONSTRAINT "letter_access_tokens_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
