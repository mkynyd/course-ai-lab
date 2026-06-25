# 架构总览

> 本章回答 LumenLab 在代码层面的模块划分、关键技术决策与核心数据流。它是理解其他架构章节(任务路由、Policy Engine、缓存、数据模型)的前置阅读。

## 本章内容

- [顶层模块划分](#顶层模块划分)
- [技术栈](#技术栈)
- [核心数据流](#核心数据流)
- [关键约定](#关键约定)
- [相关章节](#相关章节)

## 顶层模块划分

```
.
├── prisma/              # 数据模型与迁移
├── src/
│   ├── app/             # Next.js App Router(页面 + REST/SSE API)
│   ├── lib/
│   │   ├── agent/       # Agent 模式核心
│   │   ├── skills/      # 内置 Skill 包
│   │   ├── tools/       # 内置 Tool 实现
│   │   ├── chat/        # 路由与多模态客户端
│   │   ├── rag/         # 文档分块 + 检索
│   │   ├── files/       # 资料解析流水线
│   │   ├── vision/      # MiniMax M3 图片/PDF 解析
│   │   ├── parse/       # MinerU 文本解析(仅 /tools 转换流程)
│   │   ├── export/      # Markdown → DOCX / PDF / ZIP
│   │   ├── cache/       # 应用缓存与指标
│   │   ├── storage/     # 对象存储
│   │   ├── ai/          # 提示词模板、任务识别(未接入主路径)
│   │   ├── auth.*       # 认证
│   │   ├── db.ts        # Prisma Client
│   │   └── data/        # 服务端数据访问层
│   └── components/      # 前端组件(chat、project、artifact、settings 等)
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Next.js 16.2.9 (App Router) |
| 语言 | TypeScript 5、React 19 |
| 样式 | Tailwind CSS 4 |
| 数据库 | PostgreSQL 16 + pgvector 扩展 |
| ORM | Prisma 7.8.0 |
| 认证 | NextAuth.js v5 (Credentials, JWT) |
| AI 调用 | Anthropic SDK(兼容 DeepSeek / MiniMax Anthropic 接口) |
| 状态管理 | TanStack Query |
| 虚拟化 | TanStack Virtual |
| 文件解析 | MiniMax M3 OCR、MiniMax M3 PDF 原生解析、本地文本提取 |
| 文档导出 | docx、sharp、Playwright/Chromium(转换包)、pdfkit(Artifact PDF)、unified/remark |
| 缓存 | Redis 7 + TanStack Query |
| 加密 | AES-256-GCM、bcryptjs、RSA-OAEP、HMAC-SHA256 |
| 验证 | Zod 4 |
| 测试 | Vitest、Testing Library |

## 核心数据流

### 普通聊天

```
用户输入
  → /api/chat 解析请求(mode / projectId / selectedFileIds / attachments)
  → chat/router(文本/多模态分类 + 模型锁)
  → classification.ts(组装系统提示: 全局 + 用户画像 + 项目系统提示 + mode 提示)
  → RAG 检索(选中文件 / Agentic 文件范围 / 关键词 / 混合检索)
  → deepseek.ts 或 minimax-chat.ts 流式调用
  → SSE Stream → 前端实时渲染 Markdown
  → Message 异步持久化
  → 可选保存为 Artifact → 导出 MD/DOCX/PDF
```

### Agent 聊天

```
模型发出 tool_use
  → AgentEvent: tool_proposed
  → policy-engine 校验
       ├─ blocked        → AgentEvent: tool_blocked
       ├─ L1 auto        → tool-executor 执行
       ├─ L2 ask_first   → 首次审批,本会话后续可预批准
       └─ L3/L4 ask_each → AgentEvent: approval_required
                            → 用户通过 approval-card 触发 /api/agent/approve
                            → approval-token 兑换
                            → tool-executor 执行
  → AgentEvent: tool_started / tool_progress / tool_completed / tool_failed
  → audit-log 写入 AgentAuditLog
```

> 当前生产聊天路径尚未把激活的 Skill 注入 Policy Engine;DeepSeek 路径实际只使用模型内置 `web_search` 等 server 工具,新版 Tool Registry 与 Skill Registry 处于架构就绪但未完全贯通状态。

### 资料解析

```
上传文件
  → 类型/大小校验
  → 写入对象存储(local/qiniu)
  → 创建 FileAsset(status = parsing)
  → 选择解析器:
       ├─ 文本/代码 → 本地读取
       ├─ 图片     → MiniMax M3 OCR
       └─ PDF      → MiniMax M3 原生文档解析
  → 输出 textContent
  → 创建 DocumentChunk(可选 embedding)
  → 刷新 ProjectIndex
  → 标记 parsed
```

> Office/WPS/iWork 格式直接拒绝,需先去 `/tools` 转换为 PDF。

### 成果导出

```
Artifact 正文(Markdown)
  → 直接返回(markdown)
  → markdown-to-docx(Artifact DOCX,图片仅保留 alt 文本)
  → markdown-to-pdf(Artifact PDF,PDFKit + Noto Sans SC)
  → 应用缓存(Redis, 1h TTL,仅按 content 哈希)
```

### 文档转换完整包

```
DocumentConversion(MinerU Markdown + pics/)
  → conversion-package.ts
  → DOCX + Chromium PDF + ZIP
  → 对象存储缓存
```

## 关键约定

### 跨租户预检

- 所有用户资源(项目、文件、对话、Artifact)按 `session.user.id` 隔离。
- 服务端 data/ 层与每个 API Route 在访问前重新校验归属,不可依赖前端传入的 userId。

### Provider 抽象

- AI 调用统一通过 Anthropic SDK 的兼容接口。
- DeepSeek 与 MiniMax 共享同一套客户端,通过 `provider` 区分。
- 中央 API Key 通过 `provider-access.ts` 从 `ProviderCredential` 解析,客户端不感知。

### SSE 协议

- 普通聊天:Provider 原生 `data:` 行,含内容、usage、`[DONE]`。
- Agent 模式:`event: agent` 注入生命周期事件。
- 错误在流开始前以 HTTP JSON 返回,不在 SSE 中发 `event: error`。

### 缓存失效

- 客户端:精确失效(TanStack Query 的 `queryKey` 与 `invalidateQueries`)。
- 服务端:data/ 层不使用 React `cache()` 跨请求去重。
- 应用层:Artifact 导出缓存键与 `artifact.content` 哈希绑定,正文变更自动失效;删除 Artifact 不会主动清缓存,依赖 TTL。

## 相关章节

- 想了解项目类型与提示词:[任务路由](./task-router.md)
- 想了解 `tool_use` 如何被服务端控制:[Policy Engine](./policy-engine.md)
- 想了解缓存设计取舍:[缓存架构](./cache.md)
- 想了解 Prisma 模型与关系:[数据模型](./data-model.md)
