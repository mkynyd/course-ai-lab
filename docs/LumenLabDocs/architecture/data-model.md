# 数据模型

> 本章梳理 Prisma 模型与关系，覆盖普通业务表与 Agent 模式新增表。它是理解权限边界、归属校验与跨租户预检的基础。

## 本章内容

- [模型清单](#模型清单)
- [ER 总览](#er-总览)
- [核心模型说明](#核心模型说明)
- [Agent 模型说明](#agent-模型说明)
- [索引与约束](#索引与约束)
- [迁移与回滚](#迁移与回滚)
- [相关代码](#相关代码)

## 模型清单

LumenLab 当前共有 24 个 Prisma 模型，按职责分组：

| 分组 | 模型 |
|------|------|
| 用户与认证 | `User`、`ApiKey`、`RegistrationRedemption` |
| Alpha 注册与中央密钥 | `CredentialProfile`、`ProviderCredential`、`RegistrationCode`、`RegistrationPublication`、`RegistrationSyncNonce` |
| 项目与文件 | `Project`、`FileAsset`、`ProjectIndex`、`QuickAction`、`FileAssetResource` |
| 对话与消息 | `Conversation`、`Message` |
| 文档转换 | `DocumentConversion`、`DocumentConversionAsset` |
| 检索 | `DocumentChunk` |
| 成果与引用 | `Artifact`、`Reference`、`ReferenceListItem` |
| Agent | `SkillPackage`、`ConversationSkill`、`ToolDefinition`、`ToolExecution`、`ApprovalToken`、`AgentAuditLog`、`UserToolPreference` |

> 上述清单以代码为准（`prisma/schema.prisma`），后续可能扩展。

## ER 总览

```
User
 ├── ApiKey (1:N)
 ├── RegistrationRedemption (1:1)
 ├── CredentialProfile (N:1, 通过 credentialProfileId)
 ├── Project (1:N)
 │     ├── FileAsset (1:N)
 │     │     ├── DocumentChunk (1:N)
 │     │     └── FileAssetResource (1:N)
 │     ├── Conversation (1:N)
 │     │     ├── Message (1:N)
 │     │     │     └── Artifact (N:1, 通过 messageId)
 │     │     └── Artifact (1:N, 通过 conversationId)
 │     ├── Artifact (1:N)
 │     ├── ProjectIndex (1:1)
 │     └── QuickAction (1:N)
 ├── DocumentConversion (1:N)
 │     └── DocumentConversionAsset (1:N)
 ├── Artifact (1:N)
 ├── Reference (1:N)
 └── AgentAuditLog (1:N)

ConversationSkill (N:1 Conversation)
ReferenceListItem (N:1 Artifact, N:1 Reference)

SkillPackage (声明式，无 userId)
ToolDefinition (声明式，无 userId)
ApprovalToken (一次性，N:1 User / Conversation)

RegistrationCode (N:1 CredentialProfile)
RegistrationRedemption (N:1 RegistrationCode)
ProviderCredential (N:1 CredentialProfile)
RegistrationPublication / RegistrationSyncNonce (全局)
```

## 核心模型说明

### User

- 主键：`id`（cuid）。
- 关键字段：`email`（唯一）、`passwordHash`、`name`、`accessStatus`（默认 `active`，撤销时为 `revoked`）、`credentialProfileId`。
- 关联：所有用户级资源通过 `userId` 关联；注册码兑换记录通过 `RegistrationRedemption` 关联。

### ApiKey

- 用户级 Provider API Key 存储（兼容旧版）。
- 字段：`provider`、`encryptedKey`（AES-256-GCM）、`keyPrefix`。
- 当前 Provider Key 主要通过 `ProviderCredential` 集中下发，`ApiKey` 保留作兼容。

### CredentialProfile / ProviderCredential

- `CredentialProfile`：管理端发布的密钥组快照，字段 `externalId`（唯一）、`name`、`status`、`version`。
- `ProviderCredential`：密钥组内的具体 Provider Key，字段 `provider`、`encryptedKey`、`keyPrefix`、`status`、`validatedAt`。
- 用户通过注册码绑定到某个 `CredentialProfile`。

### RegistrationCode / RegistrationRedemption / RegistrationPublication / RegistrationSyncNonce

- `RegistrationCode`：注册码，字段 `codeDigest`（唯一，HMAC 摘要）、`codeHint`、`status`、`maxRedemptions`、`redemptionCount`、`expiresAt`、`publishedVersion`。
- `RegistrationRedemption`：用户兑换记录（`userId` 唯一）。
- `RegistrationPublication`：管理端同步快照发布记录，`version` 唯一。
- `RegistrationSyncNonce`：同步防重放 nonce。

### Project

- 关键字段：`name`、`description`、`type`（字符串，值 `experiment` / `review` / `coding` / `general`，默认 `general`）、`defaultModel`（默认 `deepseek-v4-pro`）、`thinkingEnabled`（默认 `true`）、`systemPrompt`。
- 无软删除字段，无 `agentModeEnabled` 开关。

### FileAsset

- 关键字段：`filename`（标准化存储文件名）、`originalName`（原始文件名）、`mimeType`、`size`、`storageProvider`（`local` / `qiniu`）、`storagePath`、`textContent`、`enhancedContent`、`enhancementStatus`（`none` / `enhancing` / `enhanced` / `stale` / `failed`）、`processingMetadata`、`status`（`uploaded` / `parsed` / `failed`）、`category`、`categoryConfidence`。
- 解析失败后可手动重试（`POST /api/files/:id/parse`）。
- 知识增强是独立接口，不会自动触发。

### FileAssetResource

- 从文档转换结果复制到项目的图片资源。
- 字段：`fileAssetId`、`relativePath`、`mimeType`、`size`、`storageProvider`、`storagePath`。

### DocumentChunk

- 关键字段：`fileAssetId`、`chunkIndex`、`content`、`contentHash`、`title`、`metadata`、`tokenCount`。
- 向量字段：`embedding Unsupported("vector(1024)")`（阿里云百炼 text-embedding-v4）。
- 检索路径：关键词匹配、混合检索（关键词 + 向量 RRF）。

### ProjectIndex

- 每个项目一份 `INDEX.md` 内容，用于文件匹配与上下文摘要。
- 字段：`projectId`（唯一）、`content`。

### QuickAction

- 项目级快捷任务按钮。
- 字段：`projectId`、`title`、`prompt`、`isSystem`、`sortOrder`。

### Conversation / Message

- `Conversation`：`userId`、`projectId`（可空）、`title`（默认 `New Chat`）、`model`、`modelLock`（MiniMax 多模态锁）、`thinkingEnabled`。
- `Message`：`conversationId`、`role`（`user` / `assistant` / `system`）、`content`、`reasoningContent`、`tokenCount`、`provider`、`cacheHitTokens`、`cacheMissTokens`。

### Artifact

- 关键字段：`userId`、`projectId`（可空）、`conversationId`（可空）、`messageId`（可空）、`title`、`type`、`format`（默认 `markdown`）、`content`。
- 成果类型由前端/API 自由字符串定义，数据库不做枚举约束；UI 当前展示约 12 种标签。

### DocumentConversion / DocumentConversionAsset

- `DocumentConversion`：独立的 `/tools` PDF → Markdown 转换结果。
- 字段：`userId`、`title`、`originalName`、`markdownContent`、`status`、`fileSize`、`pageCount`、`metadata`、`exportStorageProvider`、`exportStoragePath`、`exportSize`、`exportGeneratedAt`。
- `DocumentConversionAsset`：转换结果引用的图片资源，含 `relativePath`、`pics/` 路径规范化。

### Reference / ReferenceListItem

- `Reference`：用户引用库条目，字段 `doi`、`arxivId`、`title`、`authors`（数组）、`year`、`venue`、`url`、`rawMeta`。
- `ReferenceListItem`：成果与引用的关联，字段 `artifactId`、`referenceId`、`orderIndex`、`format`、`inlineMarker`。

## Agent 模型说明

### SkillPackage

- 声明式 Skill 包，`(skillId, version)` 唯一。
- 关键字段：`skillId`、`version`、`description`、`instructionsRef`、`allowedTools`（字符串数组）、`allowedRiskLevel`（`RiskLevel[]`，不是单个 `maxRiskLevel`）、`requiredScopes`、`defaultApprovalPolicy`、`inputContract`（JSON Schema）、`outputContract`（JSON Schema）、`dataHandlingPolicy`、`isSystem`、`installedByUserId`。

### ConversationSkill

- 单次对话中的 Skill 激活日志。
- 关键字段：`conversationId`、`skillId`、`version`、`activatedAt`、`deactivatedAt`。

### ToolDefinition

- 声明式 Tool 包。
- 关键字段：`toolId`（唯一）、`name`、`description`、`inputSchema`、`outputSchema`、`riskLevel`（`L0`–`L4`）、多个副作用布尔标志（`isReadOnly`、`hasExternalSideEffect`、`isReversible`、`containsSensitiveData`、`requiresNetwork`）、`estimatedCost`、`defaultApprovalMode`（`auto` / `ask_first` / `ask_each` / `block`）、`allowedSkillIds`、`auditLevel`（`minimal` / `standard` / `verbose`）、`requiredScopes`。

### ToolExecution

- 每次 `tool_use` 一行。
- 关键字段：
  - `toolId`、`normalizedArguments`、`argumentsHash`（sha256）。
  - `status`（字符串；TypeScript 枚举：`proposed` / `blocked` / `pending_approval` / `approved` / `rejected` / `expired` / `executing` / `succeeded` / `failed` / `cancelled`）。
  - `approvalTokenHash`、`approvalScope`、`approvalSnapshot`。
  - `riskLevel`、`skillId`、`skillVersion`。
  - `createdAt`、`expiresAt`、`approvedAt`、`executedAt`、`completedAt`。
  - `resultSummary`、`errorSummary`、`auditMetadata`。

### ApprovalToken

- 一次性审批令牌。
- 关键字段：`tokenHash`（sha256，唯一）、`userId`、`conversationId`、`toolId`、`argumentsHash`、`requestId`、`createdAt`、`expiresAt`、`consumedAt`。
- 令牌格式为 `<tokenId>.<raw>`，兑换时同时校验 `tokenHash` 与 `argumentsHash`。

### AgentAuditLog

- 结构化审计记录（best-effort 写入）。
- 关键字段：`userId`、`conversationId`、`toolExecutionId`、`skillId`、`toolId`、`eventType`、`severity`、`payload`、`ip`、`userAgent`、`createdAt`。
- 不保存 `argumentsHash`、状态、审批快照、执行时长、结果摘要；这些细节通过 `toolExecutionId` 关联到 `ToolExecution`。

### UserToolPreference

- 每用户对每个 Tool 的审批偏好覆盖。
- 字段：`userId`、`toolId`、`approvalMode`、`scope`。
- L3/L4 不能被设为 `auto`。

## 索引与约束

| 模型 | 索引 / 唯一约束 | 用途 |
|------|----------------|------|
| `User` | `email` UNIQUE | 登录 |
| `User` | `credentialProfileId` | 密钥组查询 |
| `ApiKey` | `(userId, provider)` UNIQUE | 每用户每 Provider 一个 Key |
| `CredentialProfile` | `externalId` UNIQUE | 管理端同步 |
| `ProviderCredential` | `(credentialProfileId, provider)` UNIQUE | 每组每 Provider 一个 Key |
| `RegistrationCode` | `codeDigest` UNIQUE | 注册码查找 |
| `RegistrationPublication` | `version` UNIQUE | 快照版本 |
| `RegistrationSyncNonce` | `nonce` UNIQUE | 防重放 |
| `Project` | `(userId)` | 项目列表 |
| `FileAsset` | `(userId)`、`(projectId)`、`(status)`、`(category)`、`(storageProvider)` | 资料筛选 |
| `FileAssetResource` | `(fileAssetId, relativePath)` UNIQUE | 去重 |
| `DocumentChunk` | `(userId)`、`(projectId)`、`(fileAssetId)`、`(contentHash)` | 检索与去重 |
| `Conversation` | `(userId)`、`(projectId)` | 对话列表 |
| `Message` | `(conversationId)` | 历史读取 |
| `Artifact` | `(userId)`、`(projectId)`、`(conversationId)`、`(messageId)`、`(type)` | 成果查询 |
| `DocumentConversion` | `(userId)`、`(userId, createdAt)` | 转换历史 |
| `DocumentConversionAsset` | `(conversionId, relativePath)` UNIQUE | 去重 |
| `Reference` | `(userId)`、`(projectId)`、`(arxivId)`、`(doi)` | 引用检索 |
| `ReferenceListItem` | `(artifactId, referenceId)` UNIQUE | 去重 |
| `SkillPackage` | `(skillId, version)` UNIQUE | Skill 版本 |
| `ToolDefinition` | `toolId` UNIQUE | Tool 查找 |
| `ToolExecution` | `(conversationId, createdAt)`、`(userId, status)`、`(status, expiresAt)` | 时间线 / 状态查询 |
| `ApprovalToken` | `tokenHash` UNIQUE | 兑换 |
| `AgentAuditLog` | `(userId, createdAt)`、`(conversationId, createdAt)`、`(toolExecutionId)` | 审计查询 |
| `UserToolPreference` | `(userId, toolId)` UNIQUE | 每用户每 Tool 一个偏好 |

## 迁移与回滚

- 迁移命令：
  - `npx prisma migrate dev --name <name>`（开发）
  - `npx prisma migrate deploy`（生产）
- 回滚：不推荐 `migrate resolve --rolled-back`，应新建修复迁移。

## 相关代码

| 模块 | 路径 |
|------|------|
| Schema | `prisma/schema.prisma` |
| 迁移 | `prisma/migrations/` |
| 客户端 | `src/lib/db.ts` |
| 数据访问 | `src/lib/data/` |
| Agent 写入 | `src/lib/agent/audit-log.ts`、`src/lib/agent/tool-executor.ts` |
