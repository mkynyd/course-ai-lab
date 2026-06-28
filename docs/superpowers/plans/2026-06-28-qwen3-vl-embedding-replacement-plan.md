# qwen3-vl-embedding 替换 text-embedding-v4 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `light-ai-chat` 的向量模型从 `text-embedding-v4` 完全替换为 `qwen3-vl-embedding` 的 1024 维融合模式，使用 DashScope 原生 Node.js SDK，并扩展 `DocumentChunk` 支持文本与图片/视频融合嵌入。

**Architecture:** 在 `src/lib/rag/embedding.ts` 中用 `dashscope-sdk-official` 的 `createMultiModalEmbedding` 替代 `openai` 兼容调用；在 `src/lib/rag/vector-store.ts` 的 `createDocumentChunks` 中扫描文本内的远程图片/视频 URL，按位置分配到最近 chunk 并写入新增的 `DocumentChunk.mediaUrls` 字段；`embedChunksForFile` 将 chunk 文本与 `mediaUrls` 一起作为多模态输入生成融合向量。

**Tech Stack:** Next.js 16 / TypeScript / Prisma 7 / pgvector / `dashscope-sdk-official`

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `prisma/schema.prisma` | 为 `DocumentChunk` 新增 `mediaUrls String[]` 字段并更新 embedding 注释。 |
| `prisma/migrations/20260628120000_add_document_chunk_media_urls/migration.sql` | 新增 `mediaUrls` 列的迁移 SQL。 |
| `src/lib/rag/embedding.ts` | 重写为使用 DashScope SDK 调用 `qwen3-vl-embedding` 融合模式。 |
| `src/lib/rag/vector-store.ts` | 更新 `createDocumentChunks` 提取媒体 URL 并分配；更新注释。 |
| `scripts/clear-embeddings.ts` | 清空所有现有 `DocumentChunk.embedding` 和 `mediaUrls`。 |
| `src/app/api/chat/route.test.ts` | 更新 `embedQuery` mock 返回 1024 维向量。 |
| `docs/aliyun/aliyun-text-embedding.md` | 更新模型名与调用说明。 |
| `light-ai-chat/PROJECT_SUMMARY.md` | 更新 embedding 相关记录。 |

---

## Task 1: Prisma schema 迁移 — 新增 DocumentChunk.mediaUrls

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260628120000_add_document_chunk_media_urls/migration.sql`

- [ ] **Step 1: 修改 schema.prisma 中的 DocumentChunk**

在 `prisma/schema.prisma` 中找到 `DocumentChunk` 模型，在 `metadata Json?` 之后新增字段，并更新注释：

```prisma
model DocumentChunk {
  id          String  @id @default(cuid())
  userId      String
  projectId   String?
  fileAssetId String?

  title       String?
  content     String
  contentHash String?
  chunkIndex  Int     @default(0)
  tokenCount  Int?
  metadata    Json?

  // Remote media URLs (images/videos) associated with this chunk for multimodal fusion
  mediaUrls String[]

  // pgvector embedding — 1024 dimensions (qwen3-vl-embedding fusion mode)
  embedding Unsupported("vector(1024)")?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  project   Project?   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fileAsset FileAsset? @relation(fields: [fileAssetId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([projectId])
  @@index([fileAssetId])
  @@index([contentHash])
}
```

- [ ] **Step 2: 创建迁移 SQL 文件**

创建 `prisma/migrations/20260628120000_add_document_chunk_media_urls/migration.sql`：

```sql
-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN IF NOT EXISTS "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
```

- [ ] **Step 3: 应用迁移**

运行：

```bash
cd /Users/yinjunhang/Documents/course-ai-lab/light-ai-chat
npx prisma migrate dev --name add_document_chunk_media_urls
```

Expected: 迁移成功应用，无错误。

- [ ] **Step 4: 重新生成 Prisma Client**

运行：

```bash
npx prisma generate
```

Expected: `@/generated/prisma/client` 更新，`DocumentChunk` 类型包含 `mediaUrls: string[]`。

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260628120000_add_document_chunk_media_urls/migration.sql
# 若 prisma/migrations/20260628120000_add_document_chunk_media_urls/ 目录下还生成了 migration_lock.toml 或 README，也一并 add
git commit -m "feat(db): add DocumentChunk.mediaUrls for multimodal embedding"
```

---

## Task 2: 安装 dashscope-sdk-official

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`（由 npm install 自动更新）

- [ ] **Step 1: 安装依赖**

运行：

```bash
cd /Users/yinjunhang/Documents/course-ai-lab/light-ai-chat
npm install dashscope-sdk-official
```

Expected: `package.json` 中新增 `"dashscope-sdk-official": "^1.x.x"`。

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add dashscope-sdk-official for native multimodal embedding"
```

---

## Task 3: 重写 src/lib/rag/embedding.ts

**Files:**
- Modify: `src/lib/rag/embedding.ts`

- [ ] **Step 1: 替换文件内容为 DashScope SDK 实现**

将 `src/lib/rag/embedding.ts` 完整替换为：

```typescript
import { Configuration, DashscopeApi } from "dashscope-sdk-official";
import { prisma } from "@/lib/db";

export const EMBEDDING_MODEL = "qwen3-vl-embedding";
export const EMBEDDING_DIM = 1024;
const BATCH_SIZE = 10;

function getApi(apiKey: string) {
  return new DashscopeApi(new Configuration({ apiKey }));
}

function normalizeEmbeddingInput(items: { text?: string; image?: string; video?: string }[]) {
  return items.map((item) => {
    if (item.video) return { video: item.video };
    if (item.image) return { image: item.image };
    return { text: item.text ?? "" };
  });
}

export async function embedTexts(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: number[][] = [];
  const api = getApi(apiKey);

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const result = await api.createMultiModalEmbedding({
      model: EMBEDDING_MODEL,
      input: batch.map((text) => ({ text })),
      enable_fusion: true,
      dimension: EMBEDDING_DIM,
    });

    if (result.status_code !== 200 || !result.output?.embeddings) {
      throw new Error(
        `Embedding failed: ${result.code ?? "unknown"} ${result.message ?? ""}`.trim()
      );
    }

    const embeddings = result.output.embeddings.map((item) => item.embedding);
    if (embeddings.length !== batch.length) {
      throw new Error(
        `Embedding count mismatch: expected ${batch.length}, got ${embeddings.length}`
      );
    }
    for (const embedding of embeddings) {
      if (embedding.length !== EMBEDDING_DIM) {
        throw new Error(
          `Embedding dimension mismatch: expected ${EMBEDDING_DIM}, got ${embedding.length}`
        );
      }
    }
    results.push(...embeddings);
  }

  return results;
}

export async function embedQuery(query: string, apiKey: string): Promise<number[]> {
  const embeddings = await embedTexts([query], apiKey);
  return embeddings[0] ?? [];
}

export async function embedChunksForFile(options: {
  fileAssetId: string;
  apiKey: string;
}): Promise<void> {
  const chunks = await prisma.documentChunk.findMany({
    where: { fileAssetId: options.fileAssetId },
    select: { id: true, content: true, mediaUrls: true },
    orderBy: { chunkIndex: "asc" },
  });
  if (chunks.length === 0) return;

  const api = getApi(options.apiKey);

  for (const chunk of chunks) {
    const input = normalizeEmbeddingInput([
      { text: chunk.content },
      ...(chunk.mediaUrls ?? []).map((url) => {
        if (/\.(mp4|mov|avi|webm|mkv)$/i.test(url)) return { video: url };
        return { image: url };
      }),
    ]);

    const result = await api.createMultiModalEmbedding({
      model: EMBEDDING_MODEL,
      input,
      enable_fusion: true,
      dimension: EMBEDDING_DIM,
    });

    if (result.status_code !== 200 || !result.output?.embeddings?.[0]?.embedding) {
      throw new Error(
        `Embedding failed for chunk ${chunk.id}: ${result.code ?? "unknown"} ${result.message ?? ""}`.trim()
      );
    }

    const embedding = result.output.embeddings[0].embedding;
    if (embedding.length !== EMBEDDING_DIM) {
      throw new Error(
        `Embedding dimension mismatch for chunk ${chunk.id}: expected ${EMBEDDING_DIM}, got ${embedding.length}`
      );
    }

    const vector = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
      vector,
      chunk.id
    );
  }
}
```

- [ ] **Step 2: 运行 TypeScript 检查**

运行：

```bash
npx tsc --noEmit
```

Expected: 无 `src/lib/rag/embedding.ts` 相关类型错误。

- [ ] **Step 3: Commit**

```bash
git add src/lib/rag/embedding.ts
git commit -m "feat(embedding): replace text-embedding-v4 with qwen3-vl-embedding fusion mode via DashScope SDK"
```

---

## Task 4: 扩展 vector-store.ts — chunk 媒体 URL 提取与分配

**Files:**
- Modify: `src/lib/rag/vector-store.ts`

- [ ] **Step 1: 在文件顶部新增媒体 URL 提取辅助函数**

在 `src/lib/rag/vector-store.ts` 的 `debugPayload` 函数之前（或其他合适位置）新增：

```typescript
function extractRemoteMediaUrls(text: string): string[] {
  const urls = new Set<string>();

  // Markdown image syntax: ![alt](url)
  const markdownImageRegex = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = markdownImageRegex.exec(text)) !== null) {
    urls.add(match[1]);
  }

  // HTML img tag: <img src="url" ...>
  const htmlImgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  while ((match = htmlImgRegex.exec(text)) !== null) {
    urls.add(match[1]);
  }

  // Markdown/HTML video tag: <video src="url" ...>
  const htmlVideoRegex = /<video[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  while ((match = htmlVideoRegex.exec(text)) !== null) {
    urls.add(match[1]);
  }

  return [...urls];
}

function assignMediaUrlsToChunks(text: string, chunks: string[]): string[][] {
  const allUrls = extractRemoteMediaUrls(text);
  if (allUrls.length === 0) return chunks.map(() => []);

  const chunkRanges: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const chunk of chunks) {
    const start = text.indexOf(chunk, cursor);
    const end = start >= 0 ? start + chunk.length : cursor;
    chunkRanges.push({ start, end });
    cursor = end;
  }

  const chunkMediaUrls: string[][] = chunks.map(() => []);
  for (const url of allUrls) {
    let urlIndex = text.indexOf(url);
    if (urlIndex === -1) continue;
    // Prefer first occurrence; if URL appears multiple times, only assign once.
    let bestChunk = -1;
    let bestDistance = Infinity;
    for (let i = 0; i < chunkRanges.length; i++) {
      const { start, end } = chunkRanges[i];
      if (urlIndex >= start && urlIndex < end) {
        bestChunk = i;
        break;
      }
      const distance = Math.min(
        Math.abs(urlIndex - start),
        Math.abs(urlIndex - end)
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        bestChunk = i;
      }
    }
    if (bestChunk >= 0) {
      chunkMediaUrls[bestChunk].push(url);
    }
  }

  return chunkMediaUrls;
}
```

- [ ] **Step 2: 修改 createDocumentChunks 以写入 mediaUrls**

找到 `createDocumentChunks` 函数，将 `const data = texts.map((content, i) => ({...}))` 块替换为：

```typescript
  const chunkMediaUrls = assignMediaUrlsToChunks(textContent, texts);

  // Batch insert
  const data = texts.map((content, i) => ({
    userId,
    projectId,
    fileAssetId,
    title: title || null,
    content,
    contentHash,
    chunkIndex: i,
    tokenCount: Math.ceil(content.length / 2), // rough estimate: ~2 chars per token
    mediaUrls: chunkMediaUrls[i] ?? [],
  }));
```

- [ ] **Step 3: 更新 EMBEDDING_DIM 注释**

将：

```typescript
/** Embedding dimensions — Aliyun Bailian text-embedding-v4 default */
export const EMBEDDING_DIM = 1024;
```

改为：

```typescript
/** Embedding dimensions — qwen3-vl-embedding 1024-dim fusion mode */
export const EMBEDDING_DIM = 1024;
```

- [ ] **Step 4: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: 无 `src/lib/rag/vector-store.ts` 相关类型错误。

- [ ] **Step 5: Commit**

```bash
git add src/lib/rag/vector-store.ts
git commit -m "feat(rag): extract remote media URLs and assign to chunks for multimodal fusion"
```

---

## Task 5: 创建迁移脚本清空旧向量

**Files:**
- Create: `scripts/clear-embeddings.ts`

- [ ] **Step 1: 创建脚本文件**

创建 `scripts/clear-embeddings.ts`：

```typescript
import { prisma } from "@/lib/db";

async function main() {
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "DocumentChunk" SET embedding = NULL, "mediaUrls" = '{}' WHERE embedding IS NOT NULL OR "mediaUrls" IS NULL`
  );
  console.log(`Cleared embeddings and normalized mediaUrls for ${result} rows`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: 运行脚本**

```bash
npx tsx scripts/clear-embeddings.ts
```

Expected: 输出类似 `Cleared embeddings and normalized mediaUrls for 0 rows`（数量取决于现有数据）。

- [ ] **Step 3: Commit**

```bash
git add scripts/clear-embeddings.ts
git commit -m "feat(migration): add script to clear legacy embeddings and normalize mediaUrls"
```

---

## Task 6: 更新测试

**Files:**
- Modify: `src/app/api/chat/route.test.ts`
- Create: `src/lib/rag/embedding.test.ts`

- [ ] **Step 1: 更新 route.test.ts 中的 embedQuery mock**

在 `src/app/api/chat/route.test.ts` 中找到 `embedQuery: vi.fn()` 和对应的 mock 返回值，将 `mockResolvedValue(undefined)` 改为返回 1024 维向量：

```typescript
mocks.embedQuery.mockResolvedValue(Array.from({ length: 1024 }, (_, i) => i / 1024));
```

如果文件中有多处 `mockResolvedValue(undefined)` 与 `embedQuery` 相关，全部替换为 1024 维数组。

- [ ] **Step 2: 创建 embedding.test.ts**

创建 `src/lib/rag/embedding.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { embedQuery, embedTexts, EMBEDDING_DIM, EMBEDDING_MODEL } from "./embedding";

const mockCreateMultiModalEmbedding = vi.fn();

vi.mock("dashscope-sdk-official", () => ({
  Configuration: class {},
  DashscopeApi: class {
    createMultiModalEmbedding = mockCreateMultiModalEmbedding;
  },
}));

describe("embedding", () => {
  beforeEach(() => {
    mockCreateMultiModalEmbedding.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("embedQuery returns a 1024-dim vector", async () => {
    mockCreateMultiModalEmbedding.mockResolvedValue({
      status_code: 200,
      output: {
        embeddings: [{ embedding: Array(EMBEDDING_DIM).fill(0.1) }],
      },
    });

    const vector = await embedQuery("hello", "sk-test");

    expect(vector).toHaveLength(EMBEDDING_DIM);
    expect(mockCreateMultiModalEmbedding).toHaveBeenCalledWith({
      model: EMBEDDING_MODEL,
      input: [{ text: "hello" }],
      enable_fusion: true,
      dimension: EMBEDDING_DIM,
    });
  });

  it("embedTexts batches correctly", async () => {
    mockCreateMultiModalEmbedding.mockResolvedValue({
      status_code: 200,
      output: {
        embeddings: [
          { embedding: Array(EMBEDDING_DIM).fill(0.1) },
          { embedding: Array(EMBEDDING_DIM).fill(0.2) },
        ],
      },
    });

    const vectors = await embedTexts(["a", "b"], "sk-test");

    expect(vectors).toHaveLength(2);
    expect(vectors[0]).toHaveLength(EMBEDDING_DIM);
    expect(vectors[1]).toHaveLength(EMBEDDING_DIM);
  });

  it("throws on SDK error", async () => {
    mockCreateMultiModalEmbedding.mockResolvedValue({
      status_code: 400,
      code: "InvalidParameter",
      message: "bad request",
    });

    await expect(embedQuery("hello", "sk-test")).rejects.toThrow("Embedding failed");
  });

  it("throws on dimension mismatch", async () => {
    mockCreateMultiModalEmbedding.mockResolvedValue({
      status_code: 200,
      output: {
        embeddings: [{ embedding: Array(EMBEDDING_DIM - 1).fill(0.1) }],
      },
    });

    await expect(embedQuery("hello", "sk-test")).rejects.toThrow("dimension mismatch");
  });
});
```

- [ ] **Step 3: 运行测试**

```bash
npm test
```

Expected: 所有测试通过。

- [ ] **Step 4: Commit**

```bash
git add src/app/api/chat/route.test.ts src/lib/rag/embedding.test.ts
git commit -m "test(embedding): update mocks and add DashScope SDK embedding tests"
```

---

## Task 7: 更新文档

**Files:**
- Modify: `docs/aliyun/aliyun-text-embedding.md`
- Modify: `PROJECT_SUMMARY.md`

- [ ] **Step 1: 更新 aliyun-text-embedding.md**

将文档中所有 `text-embedding-v4` 替换为 `qwen3-vl-embedding`，并更新调用示例为 DashScope SDK 多模态融合模式。例如：

```markdown
# 阿里云百炼 Embedding

LumenLab 使用 `qwen3-vl-embedding` 生成 1024 维融合向量，调用方式为 DashScope 原生 Node.js SDK。

## 模型参数

- 模型：`qwen3-vl-embedding`
- 维度：1024
- 融合模式：`enable_fusion: true`

## Node.js 调用示例

```typescript
import { Configuration, DashscopeApi } from "dashscope-sdk-official";

const api = new DashscopeApi(new Configuration({ apiKey: "sk-xxx" }));
const result = await api.createMultiModalEmbedding({
  model: "qwen3-vl-embedding",
  input: [{ text: "query text" }],
  enable_fusion: true,
  dimension: 1024,
});
const embedding = result.output?.embeddings?.[0]?.embedding;
```
```

- [ ] **Step 2: 更新 PROJECT_SUMMARY.md**

在 `light-ai-chat/PROJECT_SUMMARY.md` 中找到关于 `text-embedding-v4` 的描述，更新为 `qwen3-vl-embedding 1024 维融合模式`。

- [ ] **Step 3: Commit**

```bash
git add docs/aliyun/aliyun-text-embedding.md PROJECT_SUMMARY.md
git commit -m "docs: update embedding model references to qwen3-vl-embedding"
```

---

## Task 8: 运行最终验证

- [ ] **Step 1: 运行 lint**

```bash
npm run lint
```

Expected: 无错误。

- [ ] **Step 2: 运行测试**

```bash
npm test
```

Expected: 全部通过。

- [ ] **Step 3: 运行 build**

```bash
npm run build
```

Expected: 编译成功。

- [ ] **Step 4: Commit 任何剩余变更并推送**

```bash
git add .
git commit -m "feat: complete qwen3-vl-embedding replacement with multimodal chunk fusion"
git push origin main
```

---

## Self-Review Checklist

- [ ] Spec coverage: 设计文档中的模型替换、DashScope SDK、1024 维融合、DocumentChunk.mediaUrls、数据迁移、文档更新均已对应到具体 Task。
- [ ] Placeholder scan: 计划中没有 TBD/TODO/"实现 later"/"similar to Task N" 等占位符。
- [ ] Type consistency: `EMBEDDING_MODEL`、`EMBEDDING_DIM`、`mediaUrls`、`enable_fusion`、`dimension` 在各 Task 中命名一致。
