-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastStrangerNoteSentAt" TIMESTAMP(3),
ADD COLUMN     "strangerNotesReceived" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "strangerNotesSent" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "stranger_notes" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "stranger_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stranger_replies" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "stranger_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stranger_notes_recipientId_status_idx" ON "stranger_notes"("recipientId", "status");

-- CreateIndex
CREATE INDEX "stranger_notes_status_matchedAt_idx" ON "stranger_notes"("status", "matchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "stranger_replies_noteId_key" ON "stranger_replies"("noteId");

-- CreateIndex
CREATE INDEX "stranger_replies_createdAt_idx" ON "stranger_replies"("createdAt");

-- AddForeignKey
ALTER TABLE "stranger_notes" ADD CONSTRAINT "stranger_notes_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stranger_notes" ADD CONSTRAINT "stranger_notes_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stranger_replies" ADD CONSTRAINT "stranger_replies_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "stranger_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
