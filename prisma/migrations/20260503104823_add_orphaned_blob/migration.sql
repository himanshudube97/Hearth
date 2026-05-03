-- CreateTable
CREATE TABLE "orphaned_blobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sweptAt" TIMESTAMP(3),

    CONSTRAINT "orphaned_blobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orphaned_blobs_sweptAt_idx" ON "orphaned_blobs"("sweptAt");

-- AddForeignKey
ALTER TABLE "orphaned_blobs" ADD CONSTRAINT "orphaned_blobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
