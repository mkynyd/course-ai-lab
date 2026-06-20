-- AlterTable
ALTER TABLE "DocumentConversion"
ADD COLUMN "exportStorageProvider" TEXT,
ADD COLUMN "exportStoragePath" TEXT,
ADD COLUMN "exportSize" INTEGER,
ADD COLUMN "exportGeneratedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DocumentConversionAsset" (
    "id" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentConversionAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAssetResource" (
    "id" TEXT NOT NULL,
    "fileAssetId" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAssetResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentConversionAsset_conversionId_relativePath_key" ON "DocumentConversionAsset"("conversionId", "relativePath");
CREATE INDEX "DocumentConversionAsset_conversionId_idx" ON "DocumentConversionAsset"("conversionId");
CREATE INDEX "DocumentConversionAsset_storageProvider_idx" ON "DocumentConversionAsset"("storageProvider");
CREATE UNIQUE INDEX "FileAssetResource_fileAssetId_relativePath_key" ON "FileAssetResource"("fileAssetId", "relativePath");
CREATE INDEX "FileAssetResource_fileAssetId_idx" ON "FileAssetResource"("fileAssetId");
CREATE INDEX "FileAssetResource_storageProvider_idx" ON "FileAssetResource"("storageProvider");

-- AddForeignKey
ALTER TABLE "DocumentConversionAsset" ADD CONSTRAINT "DocumentConversionAsset_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "DocumentConversion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileAssetResource" ADD CONSTRAINT "FileAssetResource_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
