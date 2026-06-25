# 缓存架构

> LumenLab 采用多层缓存设计:客户端状态、服务端请求去重(有限)、应用缓存、Provider 侧缓存指标。本章说明每一层的设计取舍、失效策略与降级路径。

## 本章内容

- [缓存层总览](#缓存层总览)
- [客户端状态缓存](#客户端状态缓存)
- [应用缓存](#应用缓存)
- [缓存指标](#缓存指标)
- [Provider 侧缓存实验](#provider-侧缓存实验)
- [降级路径](#降级路径)
- [相关代码](#相关代码)

## 缓存层总览

| 层 | 实现 | 作用域 | 主要策略 |
|----|------|--------|----------|
| 客户端状态 | TanStack Query | 浏览器会话 | 默认 staleTime / gcTime,精确失效 |
| 应用缓存 | Redis + 内存降级 | 进程 / 实例 | 限流、导出缓存、导出命中计数 |
| Provider 侧 | DeepSeek KV / MiniMax active cache | Provider | 自动或实验开关,默认关闭 |

> 服务端 data/ 层未使用 React `cache()` 做请求去重。

## 客户端状态缓存

- **统一 Query Key**:每个数据域有唯一的 `queryKeys` 工厂函数。
- **typed hooks**:每个数据域有 `useXxxQuery` / `useXxxMutation`。
- **精确失效**:变更后调用 `queryClient.invalidateQueries`。
- **乐观更新**:当前主要用于删除操作(`use-projects.ts`、`use-conversations.ts`、`use-conversions.ts`)。

## 应用缓存

### 限流

- 滑动窗口实现,按 `userId` 或 IP 计数。
- 阈值硬编码在 `src/lib/rate-limit.ts`(`CHAT` 30/分钟、`FILE_UPLOAD` 20/分钟等),不可通过 `.env` 调整。
- Redis 不可用时降级为有界内存实现。

### 导出缓存

- 位置:`src/lib/cache/export-cache.ts`。
- 键格式:`export:<artifactId>:<format>:<contentHash>`。
- 仅按 `artifact.content` 哈希生成,不覆盖关联图片变更。
- TTL 硬编码 3600 秒。
- Redis 不可用时直接重新生成,不报错。

### 指标计数

- 位置:`src/lib/cache/api-cache-metrics.ts`。
- 聚合 `prisma.message` 中的 `cacheHitTokens` / `cacheMissTokens`。
- 统计导出 hit/miss 计数(来自 Redis)。

## 缓存指标

- `/api/metrics/cache?days=7` 返回 token 用量、缓存命中率(按模型/项目/日期)、导出命中/未命中。
- 设置页当前只展示 token 用量,不展示缓存命中率与导出指标。

## Provider 侧缓存实验

| 变量 | 默认 | 说明 |
|------|------|------|
| `CACHE_EXPERIMENT_PROMPT_REORDER` | `false` | 自适应提示排序 |
| `CACHE_EXPERIMENT_REORDER_STRATEGY` | `rag-to-last-user` | 排序策略 |
| `CACHE_EXPERIMENT_MINIMAX_ACTIVE` | `false` | MiniMax 解析 active cache |

- DeepSeek KV Cache 为 Provider 侧自动行为,应用只记录 `cacheHitTokens` / `cacheMissTokens`。
- MiniMax active cache 应用于图片和文档解析请求。

## 降级路径

| 层 | 故障 | 降级行为 |
|----|------|----------|
| 客户端 | 网络异常 | TanStack Query 自动重试 |
| Redis | 不可用 | 限流降级为内存;导出直接重新生成 |
| Provider | 故障 | 无自动缓存关闭逻辑,依赖手动调整实验开关 |

## 相关代码

| 模块 | 路径 |
|------|------|
| 限流 | `src/lib/rate-limit.ts` |
| 导出缓存 | `src/lib/cache/export-cache.ts` |
| 缓存指标 | `src/lib/cache/api-cache-metrics.ts` |
| 缓存实验配置 | `src/lib/cache/experiment-config.ts` |
| 提示排序 | `src/lib/cache/prompt-reorder.ts` |
| MiniMax active cache | `src/lib/cache/minimax-active-cache.ts` |
