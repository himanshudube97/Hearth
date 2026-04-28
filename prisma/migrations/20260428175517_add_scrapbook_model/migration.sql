-- CreateTable
CREATE TABLE "scrapbooks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "items" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scrapbooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scrapbooks_userId_updatedAt_idx" ON "scrapbooks"("userId", "updatedAt" DESC);

-- AddForeignKey
ALTER TABLE "scrapbooks" ADD CONSTRAINT "scrapbooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
