-- AlterTable
ALTER TABLE "entry_photos" ADD COLUMN     "encryptedRef" TEXT,
ADD COLUMN     "encryptedRefIV" TEXT;

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "e2eeIVs" JSONB;

-- AlterTable
ALTER TABLE "scrapbooks" ADD COLUMN     "e2eeIVs" JSONB,
ADD COLUMN     "encryptionType" TEXT NOT NULL DEFAULT 'server';

-- CreateTable
CREATE TABLE "EncryptedBlob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EncryptedBlob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EncryptedBlob_userId_idx" ON "EncryptedBlob"("userId");

-- AddForeignKey
ALTER TABLE "EncryptedBlob" ADD CONSTRAINT "EncryptedBlob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
