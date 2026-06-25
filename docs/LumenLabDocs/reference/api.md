# API 参考

> 本章列出 LumenLab 的 REST / SSE 接口。所有受保护接口必须携带有效的 NextAuth 会话 Cookie；调用 Provider API 的路由还需要用户已绑定 Credential Profile。

## 本章内容

- [通用约定](#通用约定)
- [认证相关](#认证相关)
- [聊天与 Agent](#聊天与-agent)
- [项目与文件](#项目与文件)
- [成果库](#成果库)
- [文档工具](#文档工具)
- [管理端同步](#管理端同步)
- [健康与指标](#健康与指标)

## 通用约定

- **Base URL**：与前端同源，部署时由反向代理转发。
- **响应格式**：
  - 成功：通常直接返回资源 JSON。
  - 错误：`{ "error": "string" }` 或 `{ "error": { "<field>": ["message"] } }`。
- **分页**：当前未实现统一分页，各接口按自身规则返回。
- **SSE**：`Content-Type: text/event-stream`。普通聊天为 Provider 原生的 `data:` 行；Agent 事件以 `event: agent` 行注入。

## 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth 登录、回调与会话 |
| `POST` | `/api/auth/register` | 注册（邮箱 + 密码 + 注册码） |
| `POST` | `/api/user/switch-code` | 已登录用户更换注册码 |

请求体示例（`/api/auth/register`）：

```json
{
  "email": "student@example.com",
  "password": "********",
  "registrationCode": "ALPHA-XXXX-XXXX"
}
```

> 当前注册码注册没有 `REGISTRATION_ENABLED` 开关；只要 `REGISTRATION_CODE_PEPPER` 配置正确即可注册。

## 聊天与 Agent

### `POST /api/chat`

- 普通 / 工具聊天入口，SSE 流式响应。
- 支持 `application/json` 或 `multipart/form-data`（带附件）。
- 请求体（JSON）：

```json
{
  "conversationId": "conv_xxx",
  "projectId": "proj_xxx",
  "selectedFileIds": ["file_xxx"],
  "message": "请总结这份实验资料",
  "hiddenPrompt": "...",
  "mode": "experiment",
  "model": "deepseek-v4-pro",
  "thinkingEnabled": true,
  "reasoningEffort": "medium",
  "webSearchActive": false
}
```

- `mode` 可选值为 `experiment` / `review` / `coding` / `general`，不是 `"agent"`。
- 附件通过 `multipart/form-data` 上传，字段名 `attachments`（多个），同时 `message` 字段放 JSON 字符串。

SSE 事件：

- `data: {"choices":[...]}` — 普通增量正文（Provider 原生格式）。
- `event: agent` — Agent 生命周期事件。
- `data: {"usage":...}` — token 用量。
- `data: [DONE]` — 流结束。

> 错误在流开始前以 HTTP JSON 返回，没有 `event: error`。

### `POST /api/agent/approve`

- 兑换一次性审批令牌。
- 请求体：

```json
{
  "executionId": "exec_xxx",
  "token": "<tokenId>.<raw>",
  "scope": "once",
  "arguments": { "projectId": "...", "fileId": "..." }
}
```

- `scope`：`once` 仅本次；`session` 当前只写入 `ToolExecution.approvalScope`，端到端会话预批准尚未贯通。

### `POST /api/agent/reject`

- 显式拒绝待执行 `ToolExecution`。
- 请求体：`{ "executionId": "exec_xxx", "reason": "string" }`。

## 项目与文件

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects` | 项目列表 |
| `POST` | `/api/projects` | 创建项目 |
| `GET` | `/api/projects/:id` | 项目详情（含文件、对话、快捷任务） |
| `PATCH` | `/api/projects/:id` | 更新项目配置 |
| `DELETE` | `/api/projects/:id` | 删除项目 |
| `GET` | `/api/projects/:id/files` | 项目文件列表 |
| `POST` | `/api/projects/:id/files` | 上传文件（multipart，单次最多 50 个） |
| `POST` | `/api/projects/:id/files/batch` | 批量删除/重试 |
| `GET` | `/api/files/:id` | 文件元数据 + textContent + resources |
| `PATCH` | `/api/files/:id` | 更新文件文本 `{ "textContent": "..." }` |
| `POST` | `/api/files/:id/parse` | 重试解析 |
| `POST` | `/api/files/:id/enhance` | 触发知识增强 |
| `GET` | `/api/files/:id/download` | 下载原始文件（签名链接） |
| `DELETE` | `/api/files/:id` | 删除文件 |
| `GET` | `/api/conversations` | 独立对话列表 |
| `POST` | `/api/conversations` | 创建对话 |
| `GET` | `/api/conversations/:id` | 对话详情 + 消息历史 |
| `DELETE` | `/api/conversations/:id` | 删除对话 |

> 文件状态为 `parsing` / `parsed` / `failed`，不是 `ready`。成功状态是 `parsed`。

## 成果库

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects/:id/artifacts` | 项目成果列表 |
| `POST` | `/api/projects/:id/artifacts` | 创建成果（常由前端"保存为成果"触发） |
| `GET` | `/api/artifacts/:id` | 详情 |
| `PATCH` | `/api/artifacts/:id` | 更新（API 已实现，前端尚未接入编辑 UI） |
| `DELETE` | `/api/artifacts/:id` | 删除 |
| `GET` | `/api/artifacts/:id/export?format=markdown\|docx\|pdf` | 导出 |

> Artifact 导出为单文件，PDF 由 PDFKit 生成，DOCX 不内嵌图片。不存在 `format=zip`。

## 文档工具

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/tools/pdf-to-markdown` | 启动 PDF → Markdown 转换（MinerU） |
| `GET` | `/api/tools/conversions/:id` | 查询转换状态 |
| `GET` | `/api/tools/conversions/:id/download` | 下载转换完整包（Markdown + pics/ + Chromium PDF + DOCX） |
| `POST` | `/api/tools/conversions/:id/save-to-project` | 把转换结果保存为项目资料 |
| `GET` | `/api/tools/conversions/:id/assets/:assetId` | 获取转换结果中的图片资源 |

## 管理端同步

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/internal/registration-sync` | 接收 `course-ai-regadmin` 发布的加密快照 |

请求头：

- `x-sync-timestamp`
- `x-sync-nonce`
- `x-sync-signature`

请求体为加密 envelope，协议详见 [部署 - Alpha 注册](../deployment.md#alpha-注册与中央密钥)。

## 健康与指标

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查（DB / Redis） |
| `GET` | `/api/metrics/cache?days=7` | 缓存指标与 token 用量（已返回，但设置页仅展示 token 用量） |

`/api/health` 响应：

```json
{
  "status": "healthy",
  "timestamp": "2026-06-25T06:58:58.787Z",
  "checks": {
    "database": { "status": "ok", "latencyMs": 12 },
    "redis": { "status": "ok", "latencyMs": 3 }
  }
}
```

- `status` 可能为 `healthy` / `degraded` / `unhealthy`。
- Redis 不可用时仍返回 200，但 `status` 为 `degraded`。
