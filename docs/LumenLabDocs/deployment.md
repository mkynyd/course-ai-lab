# 部署

> 本章说明 LumenLab 的部署路径:本地开发、Docker 部署、生产部署与 Alpha 注册体系。所有路径必须满足相同的环境变量要求,详见 [配置](./reference/configuration.md)。

## 本章内容

- [本地开发](#本地开发)
- [Docker 部署](#docker-部署)
- [生产部署](#生产部署)
- [Alpha 注册与中央密钥](#alpha-注册与中央密钥)
- [反向代理与 HTTPS](#反向代理与-https)
- [数据备份与回滚](#数据备份与回滚)
- [故障排查](#故障排查)

## 本地开发

```bash
git clone https://github.com/mkynyd/lumenlab.git
cd lumenlab
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

依赖:

- Node.js 20+
- PostgreSQL 16,启用 `pgvector`
- 可选 Redis(限流会降级到内存)

## Docker 部署

仓库根目录提供 `docker-compose.yml`,包含:

- `postgres` — PostgreSQL 16 + pgvector。
- `redis` — Redis 7。

> 当前 `docker-compose.yml` 不包含 `app` 服务,应用需通过 `npm run dev` 或独立构建的 Docker 镜像运行。

启动基础设施:

```bash
docker compose up -d
```

## 生产部署

### 构建

```bash
npm run build
```

输出为 Next.js standalone 模式,镜像构建参考 `Dockerfile`。

### 关键要求

- 反向代理终止 HTTPS,应用监听内网端口。
- 数据库必须启用 `pgvector`。
- 推荐启用 Redis。
- 文件存储在生产环境必须切换为对象存储(七牛云 Kodo),不可依赖本地卷。
- 必须使用强随机 `AUTH_SECRET`、`ENCRYPTION_KEY`、`REGISTRATION_SYNC_SECRET`,且与开发环境隔离。

### 环境变量

参考 [配置 - 环境变量示例](./reference/configuration.md#环境变量示例)。

### 域名

- 主业务:`lab.example.com`(示例)
- 管理端:`regadmin.example.com`(独立部署)

两者使用独立数据库与独立 RSA 密钥对,通过 `/api/internal/registration-sync` 单向同步。

## Alpha 注册与中央密钥

> 引用自 PROJECT_SUMMARY "Alpha 注册与集中 API Key"。

### 设计目标

- 用户无感申请 Key:由管理员统一配置 DeepSeek / MiniMax Key。
- 用户无法查看明文 Key。
- 注册受注册码控制,可吊销、可禁用。

### 主业务配置

- 注册码只保存 HMAC 摘要,使用 Serializable 事务原子校验有效期、状态与兑换次数。
- 用户绑定管理员发布的 Credential Profile。
- 同步协议:RSA-OAEP + AES-256-GCM + HMAC-SHA256 + 时间戳 + nonce 防重放。
- 支持停止新兑换、停用密钥组、显式撤销已注册用户。

### 管理端(独立仓库)

- 仓库:`mkynyd/course-ai-regadmin`。
- 部署在独立域名(如 `regadmin.example.com`),独立数据库。
- 单管理员密码 + TOTP 登录。
- 密钥组、注册码、发布记录与审计日志管理。
- API Key 保存后只显示掩码,注册码明文只在创建时显示一次。

### 同步协议

管理端 → 主业务:

- 推送加密的 Credential Profile 快照。
- 主业务使用 `REGISTRATION_SYNC_PRIVATE_KEY_BASE64` 解密外层 RSA-OAEP。
- 内层 AES-256-GCM 解密载荷。
- 校验 HMAC、时间戳与 nonce,过期或重放拒绝。

### 撤销

- 停止新兑换:`RegistrationCode.status = "disabled"`,新注册被拒。
- 停用密钥组:`CredentialProfile.status = "disabled"`,已绑定用户的 Provider 调用立即失败。
- 显式撤销用户:`User.accessStatus = "revoked"`;新的 Provider 调用会被拒绝,但当前登录会话不会自动登出。

## 反向代理与 HTTPS

推荐使用 Caddy,自动申请 Let's Encrypt 证书:

```caddyfile
lab.example.com {
  reverse_proxy app:3000
  encode zstd gzip
}
```

应用通过 `auth()` 在各个 Server Component 和 API Route 中显式鉴权,反向代理需透传 `X-Forwarded-*` 头。

## 数据备份与回滚

- 数据库:每日全量 + 每小时 WAL 归档(由托管平台托管)。
- 对象存储:跨区域复制(由七牛云托管)。
- 应用代码:Git 主线 + 标签化发布。
- 回滚建议:
  - 数据库:不推荐 `prisma migrate resolve --rolled-back`,应新建修复迁移。
  - 应用:`git revert <commit>` 或回滚镜像标签。
  - 中央凭证:从历史发布版本恢复。

## 故障排查

| 现象 | 可能原因 | 排查路径 |
|------|----------|----------|
| 登录 500 | `AUTH_SECRET` 未设置 | 检查 `.env` 与运行参数 |
| 聊天无响应 | Provider Key 失效 | 查看应用日志(`resolveProviderApiKey` / chat route 错误)或 `/api/health` 排查数据库/Redis |
| 文件解析失败 | MiniMax M3 / MinerU 解析异常 | 查看 `FileAsset.processingMetadata` 中的错误信息或应用日志 |
| 注册失败 | 注册码无效 / 已用完 | 管理端核对 `RegistrationRedemption` |
| Agent Tool 被 blocked | Skill 白名单不匹配、scope 缺失、风险超限或参数校验失败 | 阅读 [Policy Engine](./architecture/policy-engine.md) |
| 导出失败 | PDFKit / DOCX / Chromium 依赖缺失 | Docker 镜像内 `ldd` 校验,或查看服务端日志 |
