# 错误码

> 本章说明 LumenLab 当前的错误返回形式。当前代码尚未统一使用 `error.code` 字段，API 大多返回明文消息或字段级校验对象；Agent 事件内部使用 `reasonCode` / `errorCode`。

## 本章内容

- [错误响应格式](#错误响应格式)
- [认证与权限](#认证与权限)
- [注册码](#注册码)
- [请求与参数](#请求与参数)
- [资源与归属](#资源与归属)
- [Provider 与模型](#provider-与模型)
- [Agent 策略与审批](#agent-策略与审批)
- [限流](#限流)
- [存储与导出](#存储与导出)

## 错误响应格式

当前 HTTP 接口主要返回以下两种形式之一：

### 普通错误

```json
{ "error": "请先登录" }
```

### 字段级校验错误

```json
{
  "error": {
    "email": ["邮箱格式不正确"],
    "password": ["密码至少 8 位"]
  }
}
```

> 目前没有统一的 `{ error: { code, message, details } }` 信封；如需前端按错误码处理，建议同时匹配 HTTP 状态码与 `error` 字符串。

## 认证与权限

| 场景 | HTTP | 实际返回示例 |
|------|------|--------------|
| 未登录 | 401 | `{ "error": "请先登录" }` |
| 凭据错误 | 401 | NextAuth Credentials provider 返回 `null`，前端显示默认凭据错误 |
| Provider 访问被撤销 | 403 | `{ "error": "该账号服务访问已被撤销" }` 等（`ProviderAccessError` 消息） |
| Provider 密钥组不可用 | 403 | `{ "error": "服务访问暂不可用" }` |

## 注册码

注册流程内部使用 `RegistrationErrorCode`，但注册 API 不会把这些 code 透传给前端，而是映射为字段级错误：

| 内部 code | 触发条件 | 前端返回 |
|-----------|----------|----------|
| `email_exists` | 邮箱已注册 | `{ "error": { "email": ["邮箱已被注册"] } }`，HTTP 409 |
| `invalid_code` | 注册码无效 | `{ "error": { "registrationCode": ["注册码无效"] } }`，HTTP 400 |
| `code_exhausted` | 注册码次数已用完 | `{ "error": { "registrationCode": ["注册码使用次数已达上限"] } }`，HTTP 400 |
| `profile_unavailable` | 对应密钥组不可用 | `{ "error": { "registrationCode": ["该注册码对应的服务配置暂不可用"] } }`，HTTP 400 |

## 请求与参数

| 场景 | HTTP | 实际返回示例 |
|------|------|--------------|
| JSON 解析失败 | 400 | `{ "error": "无效的请求体" }` 或具体字段错误 |
| 参数校验失败 | 400 | `{ "error": { "<field>": ["..."] } }` |
| 请求太频繁 | 429 | `{ "error": "请求太频繁，请稍后重试" }`（聊天） / `{ "error": "上传请求太频繁，请稍后重试" }`（文件上传） |

## 资源与归属

| 场景 | HTTP | 实际返回示例 |
|------|------|--------------|
| 项目不存在 | 404 | `{ "error": "项目不存在" }` |
| 文件不存在 | 404 | `{ "error": "文件不存在" }` |
| 对话不存在 | 404 | `{ "error": "对话不存在" }` |
| 选择文件时未提供项目 ID | 400 | `{ "error": "选择文件时必须提供项目 ID" }` |
| 部分文件不属于当前项目 | 400 | `{ "error": "部分文件不存在或不属于当前项目" }` |

## Provider 与模型

| 场景 | HTTP / SSE | 说明 |
|------|------------|------|
| Provider Key 不可用 | 403 | 在聊天请求处理前返回 JSON 错误 |
| 模型服务不可达 | 502 | `{ "error": "无法连接模型服务，请稍后重试" }` |
| DeepSeek / MiniMax 上游错误 | 4xx/5xx | `{ "error": "<上游消息>", "deepseekStatus": 4xx }` 或 `minimaxStatus` |

> Provider 错误**不返回** API Key、环境变量或内部堆栈。

## Agent 策略与审批

Policy Engine 决策通过 SSE `event: agent` 事件返回，字段包括 `type`、`reasonCode` 等。

### Tool 被 blocked 时的 reasonCode

| reasonCode | 来源 | 说明 |
|------------|------|------|
| `TOOL_NOT_REGISTERED` | Policy Engine | Tool 未注册 |
| `SCOPE_NOT_GRANTED` | Policy Engine | 用户缺少该 Tool 所需 scope |
| `WORKSPACE_BLOCKED` | Policy Engine | Workspace 策略禁用该 Tool/Skill |
| `TOOL_NOT_IN_SKILL_ALLOWLIST` | Policy Engine | Tool 不在当前 Skill 白名单 |
| `TOOL_RISK_EXCEEDS_SKILL_CEILING` | Policy Engine | Tool 风险等级超出 Skill 上限 |
| `CROSS_TENANT_ACCESS` | Policy Engine | 资源归属校验失败（当前 Policy Engine 内为占位实现） |
| `INVALID_ARGUMENTS` | Policy Engine | 参数未通过 inputSchema 子集校验 |

### 审批令牌兑换失败 reason

| reason | 说明 |
|--------|------|
| `MALFORMED` | 令牌格式错误，缺少 `<tokenId>.<raw>` |
| `NOT_FOUND` | 令牌不存在或 ID 不匹配 |
| `ALREADY_CONSUMED` | 令牌已被消费 |
| `EXPIRED` | 令牌超时 |
| `ARGUMENTS_CHANGED` | 审批期间参数被替换，拒绝执行 |

### Tool 执行失败

SSE `event: agent` 类型 `tool_failed` 携带：

```json
{
  "type": "tool_failed",
  "executionId": "...",
  "errorCode": "HANDLER_ERROR",
  "error": "工具执行失败"
}
```

- `NO_HANDLER`：无对应 handler
- `HANDLER_ERROR`：handler 抛异常

## 限流

限流模块 `src/lib/rate-limit.ts` 返回内部结构：

```ts
{ allowed: boolean; remaining: number; resetTime: number }
```

HTTP 层只返回中文提示与 429 状态码，不返回 `resetTime`。

## 存储与导出

| 场景 | 来源 | 实际表现 |
|------|------|----------|
| 上传失败 | 对象存储 / 本地 | 抛出中文错误，如 `七牛上传失败：${statusCode}` |
| 解析失败 | `parse-job.ts` | 错误写入 `FileAsset.processingMetadata.parseError` |
| 导出失败 | PDFKit / DOCX / 转换包 | 抛出异常，服务端记录日志；无统一错误码 |

> 文档转换的 Chromium PDF / ZIP 打包失败通常与 `CHROMIUM_EXECUTABLE_PATH`、Playwright 依赖或对象存储配置有关，需查看服务端日志排查。
