# 成果与导出

> Artifact 是 LumenLab 中可沉淀、可复用的回答单元。本章说明如何保存、分类、复制、导出 Artifact,以及导出缓存。

## 本章内容

- [什么是 Artifact](#什么是-artifact)
- [支持类型](#支持类型)
- [从对话保存 Artifact](#从对话保存-artifact)
- [Artifact 库](#artifact-库)
- [导出格式](#导出格式)
- [导出缓存](#导出缓存)
- [删除](#删除)
- [API 速查](#api-速查)

## 什么是 Artifact

Artifact 是一条被显式标记为"长期价值"的助手回答。它:

- 以 Markdown 作为唯一正文源。
- 可导出为 Markdown / DOCX / PDF。
- 独立于原对话存在,可被任意项目引用与复用。

> Artifact 不是快照复制,而是原始 Markdown 内容 + 元数据。

## 支持类型

API 可接受的成果类型(`src/app/api/projects/[id]/artifacts/route.ts`):

`experiment_report`、`calculation`、`error_analysis`、`plot_code`、`review_outline`、`mock_exam`、`exam_coverage`、`mistake_explanation`、`quick_memory`、`mermaid`、`code_explanation`、`markdown`、`general`。

UI 层展示约 12 种标签,如"实验报告"、"计算过程"、"复习提纲"、"代码说明"、"思维导图"等。

## 从对话保存 Artifact

入口:助手回答下方的 **保存为成果** 按钮。

保存流程:

1. 提取消息正文(内容已在前端流解析时去除 SSE 帧)。
2. 选择类型、填写标题(可默认取首行)。
3. 写入数据库,绑定 `projectId` 与原 `messageId`。

## Artifact 库

位置:项目侧栏资料工具栏中的 **成果库** 按钮。

支持的操作:

- 列表查看当前项目的 Artifact。
- 详情预览。
- 一键复制 Markdown。
- 单独导出 Markdown / DOCX / PDF。
- 删除(二次确认)。

> 当前 Artifact 库不支持搜索、筛选和编辑;`PATCH /api/artifacts/:id` 已实现,但前端编辑 UI 尚未接入。

## 导出格式

| 格式 | 来源 | 说明 |
|------|------|------|
| Markdown | 正文原文 | 唯一正文源 |
| DOCX | Markdown → DOCX | 不内嵌图片,图片引用保留为 alt 文本 |
| PDF | Markdown → PDFKit | 使用 Noto Sans SC 固定字体,非 Chromium/CSS |

> Artifact 导出为单文件,不存在 `format=zip`。带 `pics/` 的完整 ZIP 包属于 `/tools` 文档转换流程。

## 导出缓存

- 应用缓存层(Redis)保存导出产物,默认 TTL 3600 秒。
- 缓存键基于 `artifact.content` 哈希,正文变更自动失效;关联图片变更不会自动失效。
- Redis 不可用时,降级为即时生成,不报错。

## 删除

- 删除 Artifact 仅移除数据库记录。
- 不影响原对话与原项目文件。
- 当前不提供回收站,删除不可恢复。

## API 速查

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects/:id/artifacts` | 列表 |
| `POST` | `/api/projects/:id/artifacts` | 创建 |
| `GET` | `/api/artifacts/:id` | 详情 |
| `PATCH` | `/api/artifacts/:id` | 更新(前端未接入) |
| `DELETE` | `/api/artifacts/:id` | 删除 |
| `GET` | `/api/artifacts/:id/export?format=markdown\|docx\|pdf` | 导出 |

详情请阅读 [API 参考](../reference/api.md)。
