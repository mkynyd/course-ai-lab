-- CreateTable
CREATE TABLE "DocumentConversion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "markdownContent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "fileSize" INTEGER,
    "pageCount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentConversion_userId_idx" ON "DocumentConversion"("userId");

-- CreateIndex
CREATE INDEX "DocumentConversion_userId_createdAt_idx" ON "DocumentConversion"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "DocumentConversion" ADD CONSTRAINT "DocumentConversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
