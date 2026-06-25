# Policy Engine

> Policy Engine 是 Agent 模式的核心安全组件。它在每次 `tool_use` 触发时拦截、检查、决策,决定自动执行、首次审批或逐次询问用户。

## 本章内容

- [Policy Engine 是什么](#policy-engine-是什么)
- [RiskLevel 总览](#risklevel-总览)
- [决策流程](#决策流程)
- [检查项详解](#检查项详解)
- [审批令牌](#审批令牌)
- [Skill 与 Tool 的权限边界](#skill-与-tool-的权限边界)
- [审计日志](#审计日志)
- [相关代码](#相关代码)

## Policy Engine 是什么

Policy Engine 是服务端策略组件,位置:`src/lib/agent/policy-engine.ts`。

它在每次模型发出 `tool_use` 时被调用:

- 解析 Tool 名 → 查找 `ToolDefinition`。
- 解析 Skill 名 → 查找 `SkillPackage`(若传入)。
- 依次检查注册、scope、workspace 策略、Skill 白名单、风险上限、资源归属、参数。
- 最终决策:auto / require_approval / deny。

> 当前生产聊天路径调用 Policy Engine 时未传入 Skill(`skillId: undefined`),因此 Skill 白名单与风险上限检查在实际聊天中尚未生效。跨租户资源校验目前也由各 Tool handler 自行负责,Policy Engine 内为占位实现。

## RiskLevel 总览

| 等级 | 含义 | 默认行为 | 示例 |
|------|------|----------|------|
| L0 | 只读,无副作用 | 自动执行 | 预留,当前无 L0 工具 |
| L1 | 低风险,只读 / 轻副作用 | 自动执行 | `project_files.list`、`web.fetch` |
| L2 | 会话级副作用 | 首次询问(`ask_first`),通过后同会话可自动 | `artifact.save`、`reference.add` |
| L3 | 单次高风险 | 每次询问用户(`ask_each`) | `project_files.delete`、`artifact.export_docx` |
| L4 | 系统级高风险 | 预留,若存在将强制 `ask_each` | 当前未使用 |

## 决策流程

```
tool_use 进入 Policy Engine
  1. Tool 注册检查:未注册 → deny(TOOL_NOT_REGISTERED)
  2. 用户 scope 检查:缺失 → deny(SCOPE_NOT_GRANTED)
  3. Workspace 策略检查:block → deny(WORKSPACE_BLOCKED)
  4. Skill 白名单校验(若传入了 Skill):
       - Tool 不在 Skill.allowedTools 中 → deny(TOOL_NOT_IN_SKILL_ALLOWLIST)
       - Tool.riskLevel 超出 Skill.allowedRiskLevel 上限 → deny(TOOL_RISK_EXCEEDS_SKILL_CEILING)
  5. 范围校验:当前为占位实现,恒返回 ok
  6. 参数校验:极简 JSON Schema 子集(required + 基础类型)
  7. 决定 approvalMode:
       - 取 Tool.defaultApprovalMode
       - 与 Skill.defaultApprovalPolicy 取更严者
       - 与用户偏好合并(L3/L4 永远 ask_each)
  8. 会话级预批准检查(当前调用方未填充 sessionApprovals,实际不生效)
  9. auto 路径放行 / require_approval 返回
```

## 检查项详解

### Skill 白名单

- 来源:`SkillPackage.allowedTools`。
- 不可放宽:即使 Tool 本身允许,Skill 内未列出仍会被拒。

### 风险等级上限

- 来源:`SkillPackage.allowedRiskLevel`(数组,取最大值)。
- Skill 只能收紧,不能放宽。

### 范围校验

- Policy Engine 内当前为占位实现,直接返回 `{ ok: true }`。
- 真实跨租户校验在 Tool handler 内部完成,如 `src/lib/tools/shared/sanitize.ts` 的 `assertFileOwned`。

### 参数校验

- 不是 Zod,而是 `policy-engine.ts` 内自定义的 `validateArgs`。
- 仅检查 `required` 字段存在和基础类型匹配。
- 校验失败只拒绝当前调用,模型可重试。

## 审批令牌

- 每次 L2(`ask_first`)/L3/L4 审批生成一次性令牌,格式 `<tokenId>.<raw>`。
- 数据库只保存 `sha256(raw)`,明文不落库。
- 兑换时校验:
  - `tokenHash` 存在且 `record.id === tokenId`。
  - 未消费、未过期。
  - `argumentsHash` 与传入参数哈希一致,防止模型替换参数。
- 消费时更新 `consumedAt`,不删除记录。

```ts
// 简化兑换流程(伪代码)
async function redeem(token: string, args: Record<string, unknown>) {
  const dot = token.indexOf(".")
  const tokenId = token.slice(0, dot)
  const raw = token.slice(dot + 1)
  const tokenHash = sha256(raw)
  const record = await db.approvalToken.findUnique({ where: { tokenHash } })
  if (!record || record.id !== tokenId) return { ok: false, reason: "NOT_FOUND" }
  if (record.consumedAt) return { ok: false, reason: "ALREADY_CONSUMED" }
  if (record.expiresAt < now()) return { ok: false, reason: "EXPIRED" }
  if (record.argumentsHash !== hashArguments(args)) {
    return { ok: false, reason: "ARGUMENTS_CHANGED" }
  }
  await db.approvalToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
  return { ok: true }
}
```

## Skill 与 Tool 的权限边界

- Skill **只能收紧权限**,不能放宽。
- Skill 可以叠加更严格的 `defaultApprovalPolicy`。
- 当前运行时尚未实现"跨 Skill 并发拒绝",因为生产路径未传入 Skill。

## 审计日志

- `AgentAuditLog` 表保存:userId、conversationId、toolExecutionId、skillId、toolId、eventType、severity、payload、ip、userAgent、createdAt。
- 不直接保存 `argumentsHash`、状态、审批快照、执行时长、结果摘要;这些通过 `toolExecutionId` 关联到 `ToolExecution`。
- 当前无限期保留,无清理任务。

## 相关代码

| 模块 | 路径 |
|------|------|
| 策略入口 | `src/lib/agent/policy-engine.ts` |
| 工具注册 | `src/lib/agent/tool-registry.ts` |
| Skill 注册 | `src/lib/agent/skill-registry.ts` |
| 审批令牌 | `src/lib/agent/approval-token.ts` |
| 工具执行 | `src/lib/agent/tool-executor.ts` |
| 事件序列化 | `src/lib/agent/event-stream.ts` |
| 审计日志 | `src/lib/agent/audit-log.ts` |
