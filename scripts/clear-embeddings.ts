/**
 * Migration script: clear legacy embeddings and normalize mediaUrls.
 *
 * Run after switching the embedding model so that re-parsed or newly uploaded
 * files generate fresh vectors with the new model.
 *
 * Usage:
 *   npx tsx scripts/clear-embeddings.ts
 */
import { prisma } from "@/lib/db";

async function main(): Promise<void> {
  const result = await prisma.$executeRaw`
    UPDATE "DocumentChunk"
    SET embedding = NULL, "mediaUrls" = '{}'
    WHERE embedding IS NOT NULL OR "mediaUrls" IS NULL
  `;
  console.log(`Cleared embeddings and normalized mediaUrls for ${result} rows`);
}

(async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore disconnect errors
    }
  }
})();
