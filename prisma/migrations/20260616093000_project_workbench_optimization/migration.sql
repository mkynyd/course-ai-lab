-- Project workbench optimization: defaults, indexing, categories, and quick actions.

ALTER TABLE "Conversation"
ADD COLUMN "thinkingEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Project"
ALTER COLUMN "defaultModel" SET DEFAULT 'deepseek-v4-pro';

UPDATE "Project"
SET "defaultModel" = 'deepseek-v4-pro'
WHERE "defaultModel" IS NULL;

ALTER TABLE "Project"
ALTER COLUMN "defaultModel" SET NOT NULL;

ALTER TABLE "Project"
ADD COLUMN "thinkingEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "FileAsset"
ADD COLUMN "category" TEXT,
ADD COLUMN "categoryConfidence" DOUBLE PRECISION;

CREATE INDEX "FileAsset_category_idx" ON "FileAsset"("category");

CREATE TABLE "ProjectIndex" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectIndex_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectIndex_projectId_key" ON "ProjectIndex"("projectId");

ALTER TABLE "ProjectIndex"
ADD CONSTRAINT "ProjectIndex_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "QuickAction" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuickAction_projectId_idx" ON "QuickAction"("projectId");

ALTER TABLE "QuickAction"
ADD CONSTRAINT "QuickAction_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
