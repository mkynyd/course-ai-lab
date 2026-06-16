ALTER TABLE "Conversation" ADD COLUMN "modelLock" TEXT;

ALTER TABLE "DocumentChunk" ALTER COLUMN "embedding" TYPE vector(1024);
