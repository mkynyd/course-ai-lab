# Agent 模式

> Agent 模式让模型以 Skill 绑定 + Tool 调用的方式完成多步任务,所有副作用由服务端 Policy Engine 审批。本章解释 Agent 模式的运行机制、事件流与用户交互。

## 本章内容

- [什么是 Agent 模式](#什么是-agent-模式)
- [核心概念](#核心概念)
- [启用 Agent 模式](#启用-agent-模式)
- [RiskLevel 与 Policy Engine](#risklevel-与-policy-engine)
- [审批令牌](#审批令牌)
- [SSE Agent 事件流](#sse-agent-事件流)
- [前端交互](#前端交互)
- [审计与日志](#审计与日志)
- [常见问题](#常见问题)

## 什么是 Agent 模式

Agent 模式是一种**受控的多步对话**形式。模型可以在该模式下发出 `tool_use`,由服务端调度、校验、执行工具调用,并把执行结果以事件形式回灌给模型,直到任务完成或被显式取消。

与普通聊天的区别:

| 维度 | 普通聊天 | Agent 模式 |
|------|----------|------------|
| 工具调用 | 仅模型内置(如 DeepSeek `web_search`) | 受控 server/client Tool |
| 多步循环 | 单轮 | 多轮,直至任务结束 |
| 副作用 | 无 | 由 Policy Engine 审批 |
| 用户介入 | 仅在输入 | 可在每次 L3/L4 审批时介入 |
| 审计 | 仅消息日志 | `AgentAuditLog` 详细审计 |

## 核心概念

| 概念 | 说明 |
|------|------|
| Skill | 模型可用的能力包,声明工具白名单与风险上限 |
| Tool | 实际可执行的能力(如 `project_files.read`) |
| RiskLevel | L0–L4 五个等级,决定是否需要审批 |
| Policy Engine | 拦截 `tool_use` 的服务端策略组件 |
| Approval Token | 一次性审批令牌,防止参数替换 |
| Agent Event | 通过 SSE 推送给前端的生命周期事件 |

## 启用 Agent 模式

> 当前没有项目级 Agent 模式开关。Agent 工具事件会内联显示在对话中;生产聊天路径实际使用模型内置 server 工具(如 DeepSeek `web_search`),新版 Skill/Tool Registry 处于架构就绪但未完全贯通状态。

## RiskLevel 与 Policy Engine

| 等级 | 含义 | 行为 |
|------|------|------|
| L0 | 只读、无副作用 | 预留,当前无 L0 工具 |
| L1 | 只读、低风险 | 自动执行 |
| L2 | 会话级副作用 | 首次使用需审批(`ask_first`),本会话后续可自动 |
| L3 | 单次高风险 | 每次询问用户(`ask_each`) |
| L4 | 系统级高风险 | 预留,若存在将强制 `ask_each` |

Policy Engine 的检查顺序:

1. **Tool 注册**:Tool 是否已注册。
2. **用户 scope**:是否具备 Tool 所需权限。
3. **Workspace 策略**:是否被 block。
4. **Skill 白名单**(若传入 Skill):Tool 是否在允许列表。
5. **风险等级**:是否超出 Skill 上限。
6. **范围校验**:当前为占位实现,真实校验在 Tool handler 内。
7. **参数校验**:极简 JSON Schema 子集校验。
8. **approvalMode 综合决策**:结合 Tool 默认、Skill 默认、用户偏好、L3/L4 强制规则。
9. **会话预批准**:当前调用方未填充 `sessionApprovals`,实际不生效。
10. **auto 放行 / require_approval 返回**。

## 审批令牌

- 每次 L2(`ask_first`)/L3/L4 审批生成一次性令牌,格式 `<tokenId>.<raw>`。
- 数据库只保存 `sha256(raw)`,明文不落库。
- 兑换时校验 `argumentsHash`,模型在 `proposed` 与 `approved` 之间替换参数会被拒绝。
- 令牌超时后自动失效,需重新触发审批。

## SSE Agent 事件流

Agent 事件以 `event: agent` 行注入 `/api/chat` 的 SSE 流。

事件类型:

| 事件 | 触发时机 |
|------|----------|
| `tool_proposed` | 模型发出 `tool_use`,进入策略检查 |
| `tool_blocked` | 策略拒绝执行 |
| `approval_required` | 等待用户授权 |
| `approval_granted` | 用户授权通过 |
| `approval_denied` | 用户显式拒绝 |
| `approval_expired` | 审批超时 |
| `tool_started` | 工具开始执行 |
| `tool_progress` | 工具进度更新(可选) |
| `tool_completed` | 工具执行成功 |
| `tool_failed` | 工具执行失败 |

> 拒绝不中止整个任务,只标记当前 `ToolExecution` 失败,模型可继续后续步骤。

## 前端交互

- **AgentTimeline**:把事件流折叠成时间线展示。
- **ApprovalCard**:展示受影响资源、可逆性与摘要,提供动作:
  - **仅本次允许** — 生成一次性令牌。
  - **本会话同类允许** — 当前只写入 `ToolExecution.approvalScope`,端到端会话预批准尚未贯通。
  - **拒绝** — 当前 `ToolExecution` 标记失败。
- **ToolCallCard**:展示工具摘要、状态、进度、结果/错误摘要及外部发送/可逆性标签。

## 审计与日志

- 每次 `tool_use` 在 `ToolExecution` 表写入一行:
  - 标准化参数、`argumentsHash`、状态、审批快照、令牌哈希、scope、时间戳、结果/错误摘要。
- `AgentAuditLog` 提供更结构化的事件记录,通过 `toolExecutionId` 关联详情。
- 当前管理端未消费审计日志,保留策略未实现。

## 常见问题

- **为什么我看不到 Agent 入口**:当前没有独立 Agent 入口;Agent 事件会内联显示在对话中。
- **审批一直等待**:刷新页面会清空未完成审批,需重新发起对话。
- **参数被替换攻击拒绝**:模型在 `approval_required` 与 `approval_granted` 之间改了参数,系统因 `argumentsHash` 不匹配而拒绝。
