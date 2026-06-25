# 产品概览

> LumenLab 把 AI 对话、项目资料管理、文档解析与成果导出整合为同一学习工作台。本章回答:LumenLab 是什么、为谁服务、能做什么、与传统聊天工具的区别。

## 本章内容

- [产品定位](#产品定位)
- [目标用户](#目标用户)
- [核心特性](#核心特性)
- [技术栈](#技术栈)
- [与同类产品的差异](#与同类产品的差异)
- [下一步](#下一步)

## 产品定位

LumenLab 是一个**项目化**的 AI 学习工作台。区别于通用聊天工具,它把以下能力整合在同一个工作流中:

- 项目级别的资料与上下文管理。
- 项目类型驱动的提示词模板(实验、复习、编程、通用)。
- 受控的 Agent 模式(Skill + Tool + Policy 审批)。
- Artifact 成果库与可导出 Markdown / DOCX / PDF 成果。

## 目标用户

| 用户群 | 典型场景 |
|--------|----------|
| 计算机专业学生 | 实验报告、代码 review、复习提纲 |
| 通用大学生 | 课件解析、复习资料整理、笔记沉淀 |
| 课程助教 / 教师 | 作业批改、题目讲义、资料归档 |

用户通常在桌面端持续使用,需要在移动端完成查看、轻量输入与状态确认。

## 核心特性

### 项目类型驱动

- 项目分为实验、复习、编程、通用四种类型。
- 类型决定系统提示词模板与快捷任务预设。

### 项目化资料管理

- 实验、复习、编程、通用四种项目类型。
- 上传图片、PDF、文本/代码文件,自动 OCR/文本提取;支持手动触发知识增强。
- 勾选文件作为对话上下文,AI 回答基于真实资料。

### 受控 Agent 模式

- 服务端 Policy Engine 拦截 `tool_use`,按 L0–L4 风险等级决策。
- Skill 只能收紧权限,不能放宽。
- 拒绝不中止整个任务,只标记当前 ToolExecution 失败。

### 内置 Skills

- `paper-writer`、`exam-coach`、`code-reader`、`paper-reader`、`exam-extract`、`socratic-tutor` 六个内置 Skill 包。
- 每个 Skill 包含 `manifest.ts`、工具白名单、允许的风险等级、必需 scopes。

### 内置 Tools

- `project_files.list` / `read` / `delete`
- `artifact.save` / `list` / `export_docx`
- `web.fetch`(host 白名单 + 8s 超时)
- `project_rag.search`
- `arxiv.search` / `arxiv.read` / `arxiv.fetch`
- `reference.add` / `list` / `attach` / `format`

### 多模型流式对话

- DeepSeek V4 Pro / Flash,深度推理模式可选。
- MiniMax M3 负责多模态(图片 OCR、PDF 文档解析)。
- SSE 流式输出,Markdown / KaTeX / Mermaid / 代码高亮实时渲染。

### PDF 文档转换

- MinerU 解析为包含公式、表格、图片的 Markdown。
- 下载包含 Markdown、图片目录、样式 PDF 与 DOCX 的完整 ZIP 包。
- 支持把转换结果保存为项目资料。

### 降级 RAG 检索

- 多策略检索:用户选中文件 / Agentic 文件范围 → 全文加载小文件 / 关键词检索 / 关键词+向量混合检索。
- 未配置 embedding 服务时回退到关键词检索。

### Artifact 成果库

- 约 12 种成果标签(数据库不约束枚举,UI 层定义)。
- Markdown 作为唯一源,AST 级转换保证格式一致。
- 导出结果通过 Redis 缓存,重复下载即时返回。

### 注册码与集中认证

- 用户注册需要邮箱、密码与有效注册码。
- 注册码由独立管理端 `course-ai-regadmin` 生成与发布。
- API Key 集中加密存储,用户无法查看明文。

## 技术栈

> 引用自根仓库 `README.md`,此处仅做索引,详情请阅读对应的架构章节。

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16.2.9 (App Router, Turbopack, Standalone 输出) |
| 语言 | TypeScript 5, React 19 |
| 数据库 | PostgreSQL 16 + pgvector 扩展 |
| ORM | Prisma 7.8.0 |
| AI 调用 | Anthropic SDK(兼容 DeepSeek / MiniMax Anthropic 接口) |
| 缓存 | Redis 7 + TanStack Query + React `cache()` |
| 认证 | NextAuth.js v5(Credentials Provider, JWT) |
| 样式 | Tailwind CSS 4 |

## 与同类产品的差异

- **项目化而非纯聊天**:每个项目独立配置系统提示词、默认模型与文件上下文。
- **可控 Agent 而非裸 Tool 调用**:所有 `tool_use` 走 Policy Engine,审计与拒绝策略一致。
- **资料沉淀而非一次性回答**:优质回答保存为 Artifact,Markdown 单一源导出多格式。
- **集中凭据而非每用户 Key**:由管理员发布凭证快照,密钥不落到客户端。

## 下一步

- 想快速跑通:阅读 [快速开始](./getting-started.md)。
- 想理解能力地图:阅读 [使用指南](./guides/projects.md)。
- 想理解底层架构:阅读 [架构总览](./architecture/overview.md)。
