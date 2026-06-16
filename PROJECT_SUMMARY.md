# course-ai-lab

> 更新时间：2026-06-15
>
> 总结范围：当前仓库、Git 提交记录、Codex 中可检索到的本项目对话
>
> 本地目录仍为 `light-ai-chat`，产品与 GitHub 项目名称已统一为 `course-ai-lab`

## 项目架构梳理与现状审查

最初对仓库进行了完整架构核对，确认项目采用 Next.js 16.2 App Router、React 19、TypeScript、Auth.js v5、Prisma 7、PostgreSQL 与 pgvector。

当时的结论是：普通聊天已经可以运行，但项目工作台仍有明显断点。项目页虽然保存了 `projectId`、`selectedFileIds` 和任务模式，前端聊天请求却没有把这些字段传给 `/api/chat`；快捷任务也没有真正填入输入框。RAG 仅有文本切块和向量字段骨架，尚无 embedding 生成。

审查还发现了消息 Markdown 渲染的 XSS 风险、React Hooks/Lint 问题、旧 `middleware.ts` 约定的弃用提示，以及本地文件存储不适合多实例部署等问题。

本轮只完成理解和验证，没有修改业务代码。

## 项目工作台核心闭环

围绕“上传资料、选择文件、快捷任务、项目上下文聊天”完成了第一轮 MVP 接线：

- 项目页支持选择文件，并把 `projectId`、`selectedFileIds`、`mode` 传入聊天请求。
- 快捷任务可填入输入框，用户可以继续编辑后再发送。
- 项目历史对话可在项目侧栏中切换和重新载入。
- `/api/chat` 增加项目、文件和对话归属校验。
- 项目资料上下文设置严格长度上限。
- 未配置 API Key 时不再提前创建空对话。
- 文件选择补充复选语义和键盘可访问性。
- 普通聊天请求保持兼容。

随后使用一次性测试账户和一条短文本资料进行了真实 DeepSeek Flash 请求，确认：

- SSE 流式响应正常。
- 选中文件内容进入模型上下文。
- 对话和回答刷新后仍可重新载入。
- 测试数据和临时 API Key 已清理。

## MiniMax 识图、PDF 解析与成果库

实施了 MiniMax 资料流水线和 Artifact 成果系统：

- 使用 `@anthropic-ai/sdk` 统一调用 DeepSeek 和 MiniMax 的 Anthropic 兼容接口。
- API Key 曾扩展为按 `deepseek`、`minimax` provider 隔离管理。
- 图片支持手动调用 MiniMax M3 OCR。
- PDF 先尝试 PDF.js 文本提取，扫描型 PDF 再降级为逐页 OCR。
- OCR 结果支持查看、编辑、重试和 DeepSeek 知识增强。
- 文本更新后会重建 DocumentChunk，并将旧增强稿标记为过期。
- RAG 统一为“选中文件优先、关键词检索补充、未来向量检索兜底”的降级路径。
- 新增 Artifact 模型、CRUD API 和项目成果库。
- 助手回答可以保存为成果。
- Markdown 作为成果唯一正文源，可导出 Markdown、DOCX 和 PDF。
- Markdown 渲染切换为 `react-markdown + remark-gfm`，移除了原有危险 HTML 注入路径。

该功能以提交 `96df5ae feat: add MiniMax document pipeline and artifact exports` 推送到主线。

## 侧边栏与项目界面调整

根据界面截图和实际浏览器操作，对应用壳层进行了调整：

- 聊天和项目入口统一移动到主侧边栏。
- 主侧边栏支持展开、收起和带边框的控制按钮。
- 进入具体项目后，主侧边栏自动收为 64px 图标栏。
- 项目功能侧边栏顶部新增“项目空间”和“新建项目”入口。
- 项目侧边栏在桌面端可收起，在移动端改为遮罩抽屉。
- 顶栏移除重复的聊天和项目导航。
- 主导航、项目资料栏和成果库统一为 300ms 平滑位移动画。
- 移动端遮罩同步淡入淡出，并支持 `prefers-reduced-motion`。

相关交互经过桌面端和 390×844 移动视口浏览器验证。

## 项目与 GitHub 重命名

项目品牌从 `Light AI Chat` / `light-ai-chat` 统一为 `course-ai-lab`：

- npm 包名、页面标题、登录注册页、导航文案和文档完成改名。
- GitHub 仓库从 `mkynyd/course-lab` 改名为 `mkynyd/course-ai-lab`。
- 本地 `origin` 曾同步更新到新地址。
- 本地文件夹名仍保留为 `light-ai-chat`。

改名后测试、Lint 和生产构建均通过。

## 四层缓存架构

依据 `docs/cache-architecture-codex-prompt.md`，完成了四层缓存与性能优化：

- 客户端缓存：TanStack Query，统一 Query Key、typed hooks、精确失效和乐观更新。
- 服务端请求去重：React `cache()` 数据访问层，仅在单次请求内去重。
- 应用缓存：Redis 用于滑动窗口限流、Artifact 导出缓存和指标计数。
- 外部 API 缓存：记录 DeepSeek/MiniMax 缓存 token，提供默认关闭的实验骨架。
- Redis 不可用时，限流自动降级到有界内存实现，导出回退为即时生成。
- Settings 增加缓存命中率指标。
- 长对话使用 TanStack Virtual，流式中的最后一条消息保持直接渲染。
- 新增 `IMPLEMENTATION.md` 和缓存架构执行计划。

缓存功能提交为 `1765a5a feat: add four-layer cache architecture design`，后续通过 PR 合并到 `main`。

缓存分支已统一改名为 `MKYN/cache-architecture`。

## Alpha 注册与集中 API Key

为小规模 Alpha 测试设计并实现了注册码与集中密钥体系。该工作同时涉及主业务和独立管理端。

主业务 `course-ai-lab` 完成：

- 注册改为“邮箱 + 密码 + 必填注册码”。
- 注册码只保存 HMAC 摘要，不保存可兑换明文。
- 使用 Serializable 事务原子校验有效期、状态和兑换次数。
- 用户绑定管理员发布的 Credential Profile。
- DeepSeek/MiniMax Key 改为服务端中央解析，用户不再自行填写 API Key。
- 新增管理端发布快照同步 API。
- 同步协议使用 RSA-OAEP、AES-256-GCM、HMAC、时间戳和 nonce 防重放。
- 支持停止新兑换、停用密钥组和显式撤销已注册用户。
- `middleware.ts` 迁移为 Next.js 16 的 `proxy.ts`。
- 新增 Dockerfile、环境变量、迁移和 Alpha 用户显式清理脚本。

独立管理端 `course-ai-regadmin` 完成：

- 独立 Git 仓库、数据库、容器和加密密钥。
- 单管理员密码与 TOTP 登录。
- 密钥组、注册码、发布记录和审计日志管理。
- API Key 保存后只显示掩码。
- 注册码明文只在创建时显示一次。
- 发布前校验 DeepSeek 和 MiniMax 凭据。
- 显式向主业务发布加密版本快照。
- 提供 Docker、Caddy 和 VPS 部署配置。

主业务提交 `63e5dd3 feat: add alpha registration and managed credentials` 已推送到 `MKYN/alpha-registration`。管理端提交 `2418062` 已推送到私有仓库 `mkynyd/course-ai-regadmin` 的同名分支。

该功能尚未合并到主业务 `main`。本机 Docker 未运行，因此没有完成双数据库和真实域名环境的端到端部署验证。

## Codex 项目目录整理

曾将主业务和管理端规划为统一工作区：

```text
course-ai-lab/
├── course-ai-lab/
└── course-ai-regadmin/
```

并尝试同步 Codex 项目名称、受信任目录和历史会话路径。当前本次会话实际工作目录仍为 `/Users/yinjunhang/Documents/light-ai-chat`，后续应以磁盘和 Codex 当前配置的实时状态为准。

## 本次工程与对话总结

本次任务汇总了仓库索引、Git 历史和 Codex 可检索对话，形成当前文档。总结中特别区分了：

- 已进入 `main` 的能力。
- 已完成但仍位于功能分支的 Alpha 能力。
- 已通过单元测试、构建或浏览器验证的功能。
- 尚未进行真实部署联调的部分。

## 项目架构总结

### 产品定位

`course-ai-lab` 是面向大学计算机课程的 AI 实验工作台与资料整理系统。核心目标是让学生上传实验数据、代码、课件、试卷和笔记后，通过快捷任务直接生成可复制、可编辑、可保存的 Markdown 成果。

### 技术栈

| 层级 | 技术 |
|---|---|
| 前端框架 | Next.js 16.2 App Router、React 19、TypeScript、Tailwind CSS 4 |
| 认证 | Auth.js v5、Credentials、JWT |
| 数据库 | PostgreSQL、pgvector、Prisma 7 |
| AI 调用 | Anthropic SDK，兼容 DeepSeek 与 MiniMax |
| 流式通信 | 服务端 SSE、前端流解析 |
| 文件处理 | PDF.js、`@napi-rs/canvas`、MiniMax OCR |
| RAG | DocumentChunk、关键词检索、pgvector 预留 |
| 缓存 | TanStack Query、React `cache()`、Redis、供应商 KV/Prompt Cache |
| 导出 | Markdown AST、DOCX、PDFKit |
| 测试 | Vitest、Testing Library、浏览器烟雾测试 |
| 部署 | Docker Compose、Next.js standalone；Alpha 分支补充 Docker/Caddy |

### 核心数据流

```text
用户登录
  → 创建普通对话或项目
  → 上传并解析资料
  → 选择文件或执行项目检索
  → Task Router 判定任务类型
  → Prompt 模板组装项目与资料上下文
  → DeepSeek SSE 流式生成
  → 前端实时展示正文、思考与用量
  → 消息异步持久化
  → 可保存为 Artifact
  → 导出 Markdown / DOCX / PDF
```

### 主要模块

| 模块 | 职责 |
|---|---|
| `src/app` | 页面、认证路由、聊天 API、项目/文件/成果 API |
| `src/components/chat` | 输入、快捷任务、消息渲染、虚拟列表、用量展示 |
| `src/components/project` | 项目侧栏、上传、文件选择与内容编辑 |
| `src/components/artifact` | 成果库、复制、导出和删除 |
| `src/lib/ai` | Task Router 与 Prompt 模板 |
| `src/lib/rag` | 文本切块、关键词检索和向量检索骨架 |
| `src/lib/files`、`vision` | PDF 解析与 MiniMax OCR |
| `src/lib/export` | Markdown 到 DOCX/PDF 的 AST 转换 |
| `src/lib/cache` | 导出缓存、指标与实验开关 |
| `src/lib/hooks` | TanStack Query 与流式聊天状态 |
| `src/lib/data` | 带用户归属条件的服务端数据访问 |
| `prisma` | 数据模型与迁移 |

### 安全边界

- 所有用户资源按 `session.user.id` 隔离。
- 项目、文件、对话和成果关联 ID 均在服务端重新校验。
- 密码使用 bcrypt，敏感 Key 使用 AES-256-GCM。
- 上传文件限制类型与大小，不执行用户代码。
- 模型错误和 SSE 错误不返回密钥、环境变量或内部堆栈。
- Alpha 分支进一步增加注册码摘要、中央密钥组和加密同步。

## 项目进度总结

### 已进入主线

- 注册、登录、JWT 会话和路由保护。
- 普通 DeepSeek SSE 聊天与消息持久化。
- 项目、文件、项目对话和快捷任务闭环。
- 项目资料上下文传递与归属校验。
- 文本切块、关键词降级检索和 pgvector 预留。
- MiniMax 图片 OCR 与 PDF 双模解析。
- DeepSeek 资料增强。
- Artifact 成果库及 Markdown、DOCX、PDF 导出。
- 安全 Markdown 渲染。
- 统一可收起侧边栏和移动端项目抽屉。
- 四层缓存、Redis 降级、缓存指标和长消息虚拟化。
- 项目和 GitHub 仓库统一命名为 `course-ai-lab`。
- README、产品说明、实现说明和仓库索引。

### 已完成但仍在功能分支

- Alpha 注册码注册。
- 中央 Credential Profile 与供应商密钥。
- 主业务与独立管理端的加密同步。
- 单管理员 TOTP 管理端。
- 注册码撤销、审计和版本发布。
- 主业务与管理端的 Docker/Caddy 部署资产。

### 尚未完成或需要继续验证

- Alpha 功能尚未合并到 `main`。
- 未在真实 VPS、双子域名和双数据库环境完成端到端部署。
- pgvector embedding 生成与真实语义向量检索尚未接入。
- 用户上传文件仍主要依赖本地 `uploads/`，生产环境需确认持久卷或对象存储方案。
- 缓存实验开关默认关闭，需要收集真实基线后再启用。
- 应重新核对当前磁盘目录、Codex 项目入口和 Git `origin`，避免历史目录迁移造成配置不一致。
