# 资料与 RAG

> LumenLab 把上传资料视作 AI 回答的事实基础。本章说明资料的解析流水线、检索策略与降级路径。

## 本章内容

- [资料生命周期](#资料生命周期)
- [支持的资料类型](#支持的资料类型)
- [解析流水线](#解析流水线)
- [OCR 与 PDF 解析](#ocr-与-pdf-解析)
- [知识增强](#知识增强)
- [检索策略](#检索策略)
- [文本切块与 DocumentChunk](#文本切块与-documentchunk)
- [向量检索](#向量检索)
- [常见问题](#常见问题)

## 资料生命周期

```
上传 → 写入存储 → 创建 FileAsset(status = parsing)
  → 解析完成 → status = parsed
  → 解析失败 → status = failed
```

增强状态独立管理:`enhancementStatus` = `none` / `enhancing` / `enhanced` / `stale` / `failed`。

## 支持的资料类型

| 类型 | 解析器 | 备注 |
|------|--------|------|
| PNG / JPG / WebP | MiniMax M3 OCR | 自动调用视觉模型 |
| PDF | MiniMax M3 原生文档解析 | 不区分文本型/扫描型 |
| `.md` / `.txt` / `.csv` / 代码文件 | 文本提取 | 直接读入 |

> Office/WPS/iWork 格式(PPT/DOC/XLS/Pages/Numbers/Keynote 等)直接拒绝,需先去 `/tools` 转换为 PDF。

## 解析流水线

`src/lib/files/parse-job.ts` 负责统一调度:

1. 从对象存储读取文件。
2. 选择对应解析器。
3. 输出 `textContent`。
4. 创建 `DocumentChunk`(若失败则记录警告)。
5. 若配置了 Bailian Key,生成 chunk embedding。
6. 刷新 `ProjectIndex`。

## OCR 与 PDF 解析

- **图片**:直接调用 MiniMax M3 OCR,得到结构化文本。
- **PDF**:统一调用 MiniMax M3 原生文档解析,不经过 PDF.js。
- 解析结果保存为 `textContent`,可在文件详情页查看;编辑的是 `textContent`,不是独立的 OCR 结果。

## 知识增强

- 通过 `POST /api/files/:id/enhance` 手动触发。
- 同步调用 DeepSeek 生成 `enhancedContent`。
- 增强不会重建 `DocumentChunk`;
- 全文检索时若 `enhancementStatus === "enhanced"` 会优先使用 `enhancedContent`。

## 检索策略

`src/lib/rag/vector-store.ts` 定义了 4 种 `ContextRetrievalStrategy`:

| 策略 | 触发场景 |
|------|----------|
| `no_context` | 普通闲聊,不需要资料 |
| `full_document` | 用户明确整份文件任务且文件较小(≤8000 字符) |
| `keyword_search` | 无 embedding 或策略选择关键词检索 |
| `hybrid_search` | 关键词 + 向量 RRF 融合 |

流程:

1. 若用户选中文件,可能直接全文加载(小文件)或作为候选范围。
2. 否则通过 `selectFilesWithDeepSeek` 做 Agentic 文件范围选择。
3. 在候选范围内做关键词或混合检索。
4. 全项目语料任务(如提取知识点)会绕过 Agentic narrowing,直接取所有 parsed/partial 文件。

## 文本切块与 DocumentChunk

- 切块大小:1500 字符,重叠 150 字符(硬编码于 `src/lib/rag/vector-store.ts`)。
- 每个 chunk 关联 `fileAssetId` 与 `projectId`。
- 字段:`chunkIndex`、`content`、`contentHash`、`title`、`metadata`、`tokenCount`。

## 向量检索

- 已接入阿里云百炼 `text-embedding-v4`,向量维度 1024。
- 用户在设置中添加 Bailian API Key 后,解析文件会自动生成 chunk embedding。
- 混合检索使用 pgvector 余弦距离 + 关键词 RRF 融合。
- 设置页目前没有"向量命中率"指标。

## 常见问题

- **解析失败**:检查文件格式与大小(单文件 ≤20MB),查看 `FileAsset.processingMetadata.parseError`。
- **检索为空**:检查文件状态是否为 `parsed`,或显式勾选文件作为上下文。
- **向量检索未生效**:确认已添加 Bailian API Key。
