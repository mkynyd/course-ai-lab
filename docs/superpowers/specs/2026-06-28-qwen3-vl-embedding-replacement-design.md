# 使用 qwen3-vl-embedding 完全替换 text-embedding-v4

日期：2026-06-28
状态：等待用户批准

## 1. 目标

将 `light-ai-chat` 项目中的向量生成模型从 `text-embedding-v4` 完全替换为 `qwen3-vl-embedding` 的 1024 维融合模式，并同步扩展文档侧的多模态嵌入能力：

- 调用方式从 OpenAI 兼容接口切换为 DashScope 原生 Node.js SDK。
- 固定使用 `qwen3-vl-embedding`、`enable_fusion=true`、`dimension=1024`。
- `DocumentChunk` 新增结构化 `mediaUrls` 字段，用于存储与 chunk 关联的图片/视频 URL。
- 文本 chunk 与关联媒体融合生成单一向量，供 hybrid_search 使用。
- 清空历史 `text-embedding-v4` 向量，新上传或重新解析的文件自动使用新模型。

## 2. 当前问题

`src/lib/rag/embedding.ts` 当前基于 `openai` 客户端调用百炼兼容模式：

```typescript
const resp = await client.embeddings.create({
  model: EMBEDDING_MODEL, // "text-embedding-v4"
  input: batch,
  dimensions: EMBEDDING_DIM,
  encoding_format: "float",
});
```

`qwen3-vl-embedding` 的融合模式不支持 OpenAI 兼容接口，必须使用 DashScope 原生接口；同时当前 `DocumentChunk` 只有文本 `content`，无法把图片/视频与文本融合成同一个向量。

## 3. 方案

### 方案 A：DashScope SDK + 新增 DocumentChunk.mediaUrls（采用）

- 安装 `dashscope-sdk-official`，使用 `createMultiModalEmbedding` 生成融合向量。
- 新增 `DocumentChunk.mediaUrls String[]` 字段，结构化保存 chunk 关联的媒体 URL。
- 在 `createDocumentChunks` 中扫描文本内容里的图片 URL，按位置分配到最近 chunk。
- `embedChunksForFile` 将 `{ text }` 与 `{ image }` / `{ video }` 一并传入 SDK。

优点：符合官方推荐调用方式，数据模型清晰，为后续多模态 RAG 打好基础。缺点：需要新增 Prisma 字段与迁移脚本。

## 4. 数据模型变更

### 4.1 DocumentChunk

新增字段：

- `mediaUrls String[]`：与该 chunk 关联的媒体 URL 列表（图片或视频）。

更新注释：

```prisma
// pgvector embedding — 1024 dimensions (qwen3-vl-embedding fusion mode)
embedding Unsupported("vector(1024)")?
```

新增迁移文件，仅增加 `mediaUrls` 列，不影响现有数据。

## 5. Embedding 客户端改造

### 5.1 依赖

```json
"dashscope-sdk-official": "^1.x"
```

### 5.2 src/lib/rag/embedding.ts

```typescript
import { Configuration, DashscopeApi } from "dashscope-sdk-official";

export const EMBEDDING_MODEL = "qwen3-vl-embedding";
export const EMBEDDING_DIM = 1024;

function getApi(apiKey: string) {
  return new DashscopeApi(new Configuration({ apiKey }));
}

export async function embedTexts(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  const api = getApi(apiKey);
  const result = await api.createMultiModalEmbedding({
    model: EMBEDDING_MODEL,
    input: texts.map((text) => ({ text })),
    enable_fusion: true,
    dimension: EMBEDDING_DIM,
  });
  if (result.status_code !== 200 || !result.output?.embeddings) {
    throw new Error(
      `Embedding failed: ${result.code ?? "unknown"} ${result.message ?? ""}`
    );
  }
  return result.output.embeddings.map((item) => item.embedding);
}

export async function embedQuery(query: string, apiKey: string): Promise<number[]> {
  const embeddings = await embedTexts([query], apiKey);
  return embeddings[0] ?? [];
}
```

`embedChunksForFile` 改为：

```typescript
const input: MultiModalContentItem[] = [{ text: chunk.content }];
for (const url of chunk.mediaUrls ?? []) {
  if (url.match(/\.(mp4|mov|avi|webm)$/i)) {
    input.push({ video: url });
  } else {
    input.push({ image: url });
  }
}
const result = await api.createMultiModalEmbedding({
  model: EMBEDDING_MODEL,
  input,
  enable_fusion: true,
  dimension: EMBEDDING_DIM,
});
```

### 5.3 src/lib/rag/vector-store.ts

- 更新 `EMBEDDING_DIM` 注释为 qwen3-vl-embedding。
- `createDocumentChunks` 增加 `mediaUrls` 分配逻辑：扫描 `textContent` 中的 `![alt](url)` 和 `<img src="url">`，按 URL 在文本中的位置映射到最近 chunk；URL 去重后写入 `DocumentChunk.mediaUrls`。
- 保留纯文本文件 mediaUrls 为空数组的行为。

## 6. 多模态 Chunk 关联

### 6.1 URL 提取规则

- 只提取 `http://` / `https://` 的远程 URL。
- 不处理 `data:` URI（避免向量输入过大）。
- 不处理相对路径（项目资源如需使用，应先通过签名 URL 服务转换为可公开访问 URL，超出本轮范围）。

### 6.2 分配策略

- 按 URL 在 `textContent` 中的首次出现位置，找到该位置所属的 chunk（使用 chunk 的字符范围）。
- 一个 chunk 可包含多个媒体 URL；同一 URL 只分配一次。

## 7. 数据迁移

新增脚本 `scripts/clear-embeddings.ts`：

```typescript
await prisma.$executeRaw`UPDATE "DocumentChunk" SET embedding = NULL, "mediaUrls" = '{}';
```

运行方式：

```bash
npx tsx scripts/clear-embeddings.ts
```

该脚本仅清空向量和媒体 URL，不删除 chunk 内容。已上传的文件需要重新解析才能生成新向量和媒体关联。

## 8. 文档与注释更新

- `docs/aliyun/aliyun-text-embedding.md`：更新模型名、调用示例和参数说明。
- `light-ai-chat/PROJECT_SUMMARY.md`：更新 embedding 相关记录。
- `prisma/schema.prisma`：更新 `DocumentChunk` 注释。
- `src/lib/rag/vector-store.ts` 中 `EMBEDDING_DIM` 注释同步更新。

## 9. 测试与验收

### 自动测试

- 更新 `src/app/api/chat/route.test.ts` 中 `embedQuery` mock，返回 1024 维向量。
- 新增 `src/lib/rag/embedding.test.ts`（可选）：验证 SDK 调用参数和结果提取。
- 运行：

```bash
npm install
npx prisma migrate dev
npx tsx scripts/clear-embeddings.ts
npm test
npm run lint
npm run build
```

### 真实 API 验收

在具备有效百炼 API Key 的环境下：

1. 上传一张图片文件，确认 `DocumentChunk.mediaUrls` 包含图片 URL，且 `embedding` 生成成功。
2. 上传一个含图片引用的 PDF，确认相关 chunk 的 `mediaUrls` 不为空。
3. 在项目对话中触发 hybrid_search，确认检索返回结果。
4. 检查向量维度严格为 1024。

若环境缺少可用 Key，仅跳过真实 API 调用并明确报告；自动测试和编译仍须通过。

## 10. 非目标

- 不替换文本生成、多模态聊天等其他百炼调用；仅替换 embedding。
- 不把图片/视频作为独立向量存储；本轮只支持与同 chunk 文本融合。
- 不实现相对路径图片的签名 URL 转换；只处理已可公开访问的远程 URL。
- 不回退到 `text-embedding-v4`；完全替换为新模型。
