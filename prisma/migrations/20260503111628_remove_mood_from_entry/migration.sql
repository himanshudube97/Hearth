/*
  Warnings:

  - You are about to drop the column `mood` on the `journal_entries` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "journal_entries_userId_createdAt_mood_idx";

-- DropIndex
DROP INDEX "journal_entries_userId_mood_idx";

-- AlterTable
ALTER TABLE "journal_entries" DROP COLUMN "mood";
