# 配置与环境变量

> 本章列出 LumenLab 实际使用的环境变量。复制 `.env.example` 为 `.env` 后按需填写。

## 本章内容

- [基础配置](#基础配置)
- [数据库与 Redis](#数据库与-redis)
- [认证与加密](#认证与加密)
- [注册码与中央密钥同步](#注册码与中央密钥同步)
- [缓存实验开关](#缓存实验开关)
- [文件与对象存储](#文件与对象存储)
- [限流与导出](#限流与导出)
- [日志](#日志)
- [环境变量示例](#环境变量示例)

## 基础配置

| 变量 | 必填 | 说明 |
|------|------|------|
| `NODE_ENV` | 否 | 标准 Node.js 运行环境，`development` / `production` |
| `AUTH_URL` | 否 | 应用对外可访问的 URL，如 `https://lab.example.com`；Auth.js 用于回调/重定向 |
| `NEXT_PUBLIC_APP_NAME` | 否 | 前端展示的应用名称，默认 `LumenLab` |

## 数据库与 Redis

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接串，需启用 `pgvector` 扩展 |
| `REDIS_URL` | 否 | Redis 连接串，默认 `redis://localhost:6379`；Redis 不可用时限流会降级到内存 |

启用 pgvector：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 认证与加密

| 变量 | 必填 | 说明 |
|------|------|------|
| `AUTH_SECRET` | 是 | NextAuth JWT 签名密钥，生产必须使用 32+ 字节随机串 |
| `ENCRYPTION_KEY` | 是 | API Key 加密密钥，64 位十六进制字符串（32 字节），用于 AES-256-GCM |

生成示例：

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 32      # ENCRYPTION_KEY
```

## 注册码与中央密钥同步

LumenLab 的 Provider API Key 由独立管理端 `course-ai-regadmin` 集中发布，通过同步接口下发。本地 `.env` 不配置 Provider Key。

| 变量 | 必填 | 说明 |
|------|------|------|
| `REGISTRATION_CODE_PEPPER` | 是 | 注册码 HMAC 摘要的 pepper，建议 48+ 字节随机串 |
| `REGISTRATION_SYNC_SECRET` | 是 | 同步请求签名 HMAC 密钥，需与管理端一致 |
| `REGISTRATION_SYNC_PRIVATE_KEY_BASE64` | 是 | 主业务 RSA 私钥（PEM 格式）的 base64 编码，用于解密管理端同步快照 |

生成示例：

```bash
openssl rand -base64 48   # REGISTRATION_CODE_PEPPER
openssl rand -base64 32   # REGISTRATION_SYNC_SECRET
```

> 同步协议：RSA-OAEP + AES-256-GCM + HMAC-SHA256 + 时间戳 + nonce 防重放。详见 [部署 - Alpha 注册](../deployment.md#alpha-注册与中央密钥)。

## 缓存实验开关

| 变量 | 默认 | 说明 |
|------|------|------|
| `CACHE_EXPERIMENT_PROMPT_REORDER` | `false` | 启用自适应提示排序（实验） |
| `CACHE_EXPERIMENT_REORDER_STRATEGY` | `rag-to-last-user` | 排序策略：`rag-to-last-user` 或 `frequent-context-to-system` |
| `CACHE_EXPERIMENT_MINIMAX_ACTIVE` | `false` | 启用 MiniMax 解析 active cache（实验） |

> DeepSeek KV Cache 为 Provider 侧自动行为，应用只记录命中 token 数，不通过环境变量控制。导出缓存 TTL 硬编码为 3600 秒。

## 文件与对象存储

存储 Provider 为自动检测：若配置了完整七牛云参数则使用 `qiniu`，否则生产环境会报错，开发环境回退到 `local`（`./uploads`）。

| 变量 | 必填 | 说明 |
|------|------|------|
| `QINIU_ACCESS_KEY` | 条件 | 七牛云 Access Key |
| `QINIU_SECRET_KEY` | 条件 | 七牛云 Secret Key |
| `QINIU_BUCKET` | 条件 | 七牛云 Kodo 私有 Bucket |
| `QINIU_REGION` | 否 | 七牛云 Region，默认 `z2` |
| `QINIU_UPLOAD_HOST` | 条件 | 七牛云上传 Host，如 `https://up-z2.qiniup.com` |
| `QINIU_PRIVATE_DOMAIN` | 条件 | 私有 Bucket 下载域名，用于生成签名下载链接 |

## 限流与导出

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 用户级限流 | `src/lib/rate-limit.ts` | 硬编码：`CHAT` 30/分钟、`FILE_UPLOAD` 20/分钟、`LOGIN` 5/分钟、`REGISTER` 3/分钟等 |
| 请求体大小 | `next.config.ts` | `experimental.proxyClientMaxBodySize: "210mb"`，用于 PDF 转换上传 |
| 导出缓存 TTL | `src/lib/cache/export-cache.ts` | 硬编码 3600 秒 |

> 限流阈值当前不可通过 `.env` 调整，需修改源码。

## 日志

| 变量 | 默认 | 说明 |
|------|------|------|
| `LOG_LEVEL` | 生产 `warn`，其他 `debug` | 日志级别，见 `src/lib/logger.ts` |

> 日志始终输出 JSON，无 `LOG_PRETTY` 开关。Agent 审计日志当前无自动清理策略。

## 环境变量示例

最小本地开发配置：

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_workspace?schema=public"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="change-me-32-bytes-min"
ENCRYPTION_KEY="change-me-64-hex-chars"
REGISTRATION_CODE_PEPPER="change-me-base64-48"
REGISTRATION_SYNC_SECRET="change-me-base64-32"
REGISTRATION_SYNC_PRIVATE_KEY_BASE64="base64-encoded-RSA-private-key-PEM"
AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="LumenLab"
```

Alpha 部署配置（节选）：

```bash
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
AUTH_SECRET="<random-32-bytes>"
ENCRYPTION_KEY="<random-64-hex>"
REGISTRATION_CODE_PEPPER="<random-base64-48>"
REGISTRATION_SYNC_SECRET="<random-base64-32>"
REGISTRATION_SYNC_PRIVATE_KEY_BASE64="<base64-RSA-private-key>"
AUTH_URL="https://lab.example.com"
NEXT_PUBLIC_APP_NAME="LumenLab"

# 七牛云对象存储（生产必填）
QINIU_ACCESS_KEY=...
QINIU_SECRET_KEY=...
QINIU_BUCKET=lumenlab
QINIU_REGION=z2
QINIU_UPLOAD_HOST=https://up-z2.qiniup.com
QINIU_PRIVATE_DOMAIN=cdn.example.com
```
