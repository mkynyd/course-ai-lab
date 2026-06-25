# Skills 与 Tools

> Skill 与 Tool 是 Agent 模式的两层能力描述。本章说明 LumenLab 内置的 Skill 与 Tool,以及如何基于声明式 manifest 自定义新能力。

## 本章内容

- [Skill 与 Tool 的关系](#skill-与-tool-的关系)
- [内置 Skill 清单](#内置-skill-清单)
- [内置 Tool 清单](#内置-tool-清单)
- [Tool 详细说明](#tool-详细说明)
- [Skill 详细说明](#skill-详细说明)
- [如何启用 Skill](#如何启用-skill)
- [如何自定义 Skill](#如何自定义-skill)
- [如何自定义 Tool](#如何自定义-tool)
- [常见问题](#常见问题)

## Skill 与 Tool 的关系

- **Tool** 是原子能力,带副作用声明与风险等级。
- **Skill** 是 Tool 的命名集合,带工具白名单、允许的风险等级、必需 scopes、输入输出契约、数据处理策略。
- Skill 不能引入 Tool 之外的工具,只能从内置 Tool 中选择并收紧权限。

## 内置 Skill 清单

| Skill ID | 允许的 Tool | 允许风险等级 | 典型场景 |
|----------|-------------|--------------|----------|
| `paper-writer` | `project_files.list/read`, `project_rag.search`, `web.search/fetch`, `artifact.save/list` | L1–L2 | 论文写作、报告草稿 |
| `exam-coach` | `project_files.list/read`, `project_rag.search`, `artifact.save/list` | L1–L2 | 复习计划、错题整理 |
| `code-reader` | `web.fetch/search`, `artifact.save/list` | L1–L2 | 读取公开仓库代码说明 |
| `paper-reader` | `project_files.*`, `arxiv.*`, `reference.*`, `artifact.save/list/export_docx`, `web.fetch` | L1–L3 | 论文速读、引用整理 |
| `exam-extract` | `project_files.list/read`, `project_rag.search`, `artifact.save/list` | L1–L2 | 考题要点抽取 |
| `socratic-tutor` | `project_files.list/read`, `project_rag.search`, `artifact.save/list` | L1–L2 | 苏格拉底式学业导师 |

每个 Skill 包含:

- `manifest.ts` — `SkillMetadata`、工具白名单、允许风险等级、必需 scopes、输入输出契约、数据处理策略。
- `instructions.ts` — TS 常量指令,作为模型的系统提示片段。

## 内置 Tool 清单

| Tool ID | 风险等级 | 默认审批模式 | 说明 |
|---------|----------|--------------|------|
| `project_files.list` | L1 | auto | 列出项目资料 |
| `project_files.read` | L1 | auto | 读取项目资料内容 |
| `project_files.delete` | L3 | ask_each | 删除项目资料 |
| `artifact.save` | L2 | ask_first | 保存当前回答为 Artifact |
| `artifact.list` | L1 | auto | 列出项目/对话的 Artifact |
| `artifact.export_docx` | L3 | ask_each | 导出 Artifact 为 DOCX |
| `web.search` | L1 | auto | 占位工具,实际联网搜索由 DeepSeek 模型内置 |
| `web.fetch` | L1 | auto | 抓取白名单域名网页,8s 超时,1.5MB body 上限 |
| `project_rag.search` | L1 | auto | 对项目资料文本做关键词检索 |
| `arxiv.search` | L1 | auto | arXiv 论文搜索 |
| `arxiv.read` | L1 | auto | 读取单篇 arXiv 元数据 |
| `arxiv.fetch` | L1 | auto | 抓取 arxiv.org 页面 |
| `reference.add` | L2 | ask_first | 新增参考文献 |
| `reference.list` | L1 | auto | 列出参考文献 |
| `reference.attach` | L2 | ask_first | 挂载引用到 Artifact |
| `reference.format` | L1 | auto | 按格式渲染引用 |

## Tool 详细说明

### `project_files.list`

- 列出当前项目文件(不含内容)。
- 参数:`projectId`(必填)。
- 返回:文件元数据列表。

### `project_files.read`

- 读取单个文件内容(限长)。
- 参数:`projectId`、`fileId`、`maxChars`(可选)。
- 返回:文本内容。

### `project_files.delete`

- 删除项目文件(级联清理解析结果)。
- 每次需要用户审批。

### `artifact.save`

- 把当前助手回答保存为 Artifact。
- 默认 `ask_first`,首次审批后同会话可自动。

### `artifact.list`

- 列出当前项目/对话下的 Artifact。

### `web.search` / `web.fetch`

- `web.search` 当前为占位工具,返回空结果;联网搜索实际由 DeepSeek 内置 `web_search_20250305` 提供。
- `web.fetch` 抓取单页 HTML / Markdown,受 host 白名单、8s 超时、1.5MB body 上限约束。

### `project_rag.search`

- 对项目已解析资料(`FileAsset.textContent`)做关键词检索。
- 不直接读取 `DocumentChunk`,也不自动启用向量检索。

## Skill 详细说明

各 Skill 的具体指令见对应 `instructions.ts`,主要侧重:

- `paper-writer`:结构化报告、引用资料原文、明确出处。
- `exam-coach`:复习计划、解题步骤、易错点提示。
- `code-reader`:代码解释、架构分析、关键路径解读。
- `paper-reader`:论文速读、引用整理、对比分析。
- `exam-extract`:严格基于资料的考题要点抽取。
- `socratic-tutor`:苏格拉底式引导,拆思路不塞答案。

## 如何启用 Skill

> 当前生产聊天路径未把 `skillRegistry` 接入;Skill 注册表处于架构就绪状态。实际聊天使用固定 legacy skill set,由 `webSearchActive` 等条件触发。

## 如何自定义 Skill

最小步骤:

1. 在 `src/lib/skills/<skill-id>/` 下创建 `manifest.ts`。
2. 定义 `SkillMetadata`:
   - `skillId`、`version`、`description`。
   - `allowedTools: string[]`。
   - `allowedRiskLevel: RiskLevel[]`。
   - `requiredScopes: string[]`。
   - `defaultApprovalPolicy: ApprovalMode`。
   - `inputContract` / `outputContract`(JSON Schema 对象)。
   - `dataHandlingPolicy: { maySendToExternal, mayPersist, retentionDays? }`。
3. 在 `src/lib/skills/<skill-id>/instructions.ts` 写入 TS 常量指令。
4. 在 `src/lib/skills/registry.ts` 注册 Skill。
5. 如需接入生产聊天,还需在 `src/app/api/chat/route.ts` 把 Skill 注入 Agent context。

## 如何自定义 Tool

最小步骤:

1. 在 `src/lib/tools/<category>/` 下实现 handler。
2. 在 `src/lib/tools/registry.ts` 中央注册:
   - `toolId`、`name`、`description`、`inputSchema`、`outputSchema`。
   - `riskLevel`。
   - 副作用标志:`isReadOnly`、`hasExternalSideEffect`、`isReversible`、`containsSensitiveData`、`requiresNetwork`。
   - `defaultApprovalMode`(auto / ask_first / ask_each / block)。
   - `allowedSkillIds: string[]`。
   - `auditLevel`、`requiredScopes`。
3. 如需接入生产聊天,还需更新聊天路由的工具 payload 构建逻辑。

## 常见问题

- **自定义 Skill 不生效**:检查 `registry.ts` 是否成功导入,且 `version` 唯一;并确认聊天路由已把 Skill 注入 context。
- **Tool 调用一直 `blocked`**:多半是 Skill allowlist 不含该 Tool、风险等级超限、参数校验失败或 Tool 未注册。
- **`SkillPackage` 表**:数据库中存在但当前运行时尚未读取,Skill 注册完全在内存中的 `skillRegistry` 完成。
