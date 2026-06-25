# LumenLab 文档

> LumenLab 是一个面向大学计算机课程的 AI 实验工作台。本目录是 LumenLab 官方文档的内容源,采用 Markdown 编写;如需发布为站点,可额外配置 VitePress、Nextra 或 Docusaurus。

## 文档导航

### 产品与上手

- [产品概览](./overview.md) — 产品定位、目标用户、核心特性、技术栈
- [快速开始](./getting-started.md) — 安装、环境配置、第一次对话、注册码

### 使用指南

- [项目管理](./guides/projects.md) — 项目类型、上下文、系统提示词与默认模型
- [资料与 RAG](./guides/files-and-rag.md) — 上传、解析、OCR、关键词与向量检索
- [成果与导出](./guides/artifacts.md) — Artifact 库、Markdown / DOCX / PDF 导出、ZIP 完整包
- [Agent 模式](./guides/agent-mode.md) — Skill、Tool、Policy Engine、SSE 事件流与审批
- [Skills 与 Tools](./guides/skills-and-tools.md) — 内置 Skills、Tool 调用、风险等级

### 架构设计

- [架构总览](./architecture/overview.md) — 模块划分、技术栈、核心数据流
- [任务路由](./architecture/task-router.md) — 项目类型与任务识别模块
- [Policy Engine](./architecture/policy-engine.md) — L0–L4 风险等级、审批令牌、Skill 权限
- [缓存架构](./architecture/cache.md) — 四层缓存与降级路径
- [数据模型](./architecture/data-model.md) — Prisma 模型与关系

### 参考

- [API 参考](./reference/api.md) — 路由清单、请求/响应、Agent 事件
- [配置与环境变量](./reference/configuration.md) — `.env` 字段、Provider、注册码同步
- [错误码](./reference/error-codes.md) — 业务错误码、模型错误、SSE 错误

### 运维

- [部署](./deployment.md) — 本地开发、Docker、生产、Alpha 注册体系

### 其它

- [常见问题](./faq.md)

## 文档维护约定

- 文件名使用 `kebab-case.md`,首页入口文件例外(`README.md` 或 `index.md`);目录使用语义名,集合类目录可使用复数(如 `guides/`、`reference/`)。
- 每个一级文档只承担一个主题,内容较长的主题拆分到子目录(如 `architecture/`、`guides/`、`reference/`)。
- 正文中所有相对路径链接遵循上面"文档导航"的层级。
- 当 `light-ai-chat/README.md` 的内容发生变更时,需要同步回写至本文档的对应章节,避免双源不一致。
- 当代码侧模块(如 `src/lib/agent/`)出现重大变更,需同步更新对应的架构章节。
