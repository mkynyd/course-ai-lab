# 快速开始

> 本章帮助新用户在 10 分钟内跑通 LumenLab:注册账户、创建项目、上传资料、发出第一条带上下文的对话,并把回答保存为 Artifact。

## 本章内容

- [环境要求](#环境要求)
- [本地安装](#本地安装)
- [数据库初始化](#数据库初始化)
- [首次启动](#首次启动)
- [注册与登录](#注册与登录)
- [第一次对话](#第一次对话)
- [项目工作台](#项目工作台)
- [保存为 Artifact](#保存为-artifact)
- [下一步](#下一步)

## 环境要求

- Node.js 20+(Next.js 16 要求)
- npm
- PostgreSQL 16,启用 `pgvector` 扩展
- 可选:Redis 7(限流与导出缓存)

## 本地安装

```bash
git clone https://github.com/mkynyd/lumenlab.git
cd lumenlab
npm install
cp .env.example .env
```

> 说明:仓库名为 `lumenlab`;`course-ai-lab` 是本地多项目工作区目录名。

## 数据库初始化

```bash
# 1. 启动 PostgreSQL 并创建库
createdb ai_workspace

# 2. 应用 Prisma 迁移
npx prisma migrate deploy

# 3. 生成 Prisma Client
npx prisma generate
```

启用 `pgvector` 扩展:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 首次启动

```bash
npm run dev
```

应用默认运行在 `http://localhost:3000`。

> 健康检查:`GET /api/health` 返回 200 表示数据库就绪;Redis 不可用时仍返回 200,但 `status` 为 `degraded`。

## 注册与登录

当前版本注册**始终需要**有效的 Alpha 注册码,没有"开发模式绕过"。

- 注册需填写邮箱、密码、**注册码**。
- 注册码由独立管理端 `course-ai-regadmin` 颁发,只校验 HMAC 摘要,明文不落库。
- Provider API Key 不来自本地 `.env`,而是由注册码对应的 Credential Profile 集中下发。
- 注册成功后将自动绑定管理员发布的 Credential Profile。
- 详细协议请阅读 [部署 - Alpha 注册](./deployment.md#alpha-注册与中央密钥)。

## 第一次对话

1. 进入侧边栏的 **聊天** 入口。
2. 选择模型(DeepSeek V4 Pro / Flash / MiniMax M3)。
3. 输入问题,模型流式返回 Markdown。

## 项目工作台

1. 侧边栏 **项目** → **新建项目**,选择项目类型(实验 / 复习 / 编程 / 通用)。
2. 在项目侧栏上传文件(支持图片、PDF、文本/代码)。
3. 上传完成后系统自动 OCR 或文本提取;知识增强需手动触发。
4. 进入项目聊天,勾选要带入上下文的文件,发起对话。

## 保存为 Artifact

- 在助手回答下方点击 **保存为成果**。
- 选择成果类型(通用成果 / 实验报告 / 计算过程 / 复习提纲 / 代码说明 / 思维导图 …)。
- 在 **成果库** 中查看、复制与导出;编辑 UI 尚未接入。

## 下一步

- 深入理解项目与资料:阅读 [项目管理](./guides/projects.md) 与 [资料与 RAG](./guides/files-and-rag.md)。
- 了解 Agent 能力:阅读 [Agent 模式](./guides/agent-mode.md) 与 [Skills 与 Tools](./guides/skills-and-tools.md)。
- 部署到生产:阅读 [部署](./deployment.md)。
