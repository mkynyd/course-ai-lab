-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
