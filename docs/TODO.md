# TODO

> Last updated: 2026-06-29

This document tracks completed first-slice Agent Orchestrator work plus deferred Skill, Tool, and follow-up action work.

## Completed First Slice

- Added the `AGENT_ORCHESTRATOR_ENABLED` feature flag. Development defaults to enabled; production defaults to disabled unless explicitly set.
- Added a deterministic Skill Router for all six built-in Skills, including `awaiting_context` for missing material and regular RAG behavior for ordinary summaries.
- Added provider-neutral planned tool execution for `project_files.read`, `project_rag.search`, and `web.fetch`; `project_files.list` and `artifact.save` remain registered MVP tools for explicit follow-up actions.
- Added `Message.sources`, `Artifact.metadata`, and source aggregation/dedup so references render at the bottom of assistant messages rather than inline in the answer.
- Upgraded `web.fetch` to accept explicit public HTTP(S) URLs with SSRF checks, redirect revalidation, body limits, and HTML-to-Markdown cleanup.
- Added `scripts/seed-dev-access.ts` for reset local databases and optional four-provider user API key setup.

## Agent Skills Roadmap

### MVP Scope

- Build a provider-neutral Agent path before expanding individual Skill prompts.
- Add a Skill Router that selects from all six built-in Skills:
  - `paper-reader`
  - `paper-writer`
  - `exam-extract`
  - `exam-coach`
  - `code-reader`
  - `socratic-tutor`
- Route with structured signals first. TODO: add an optional DeepSeek fast JSON classifier for low-confidence ties.
- Keep Skill activation visible in the SSE event stream and chat header status bar. TODO: add explicit user controls to switch or disable the active Skill from the UI.
- Persist the current Skill on `Conversation`; record activation history and audit fields in `ConversationSkill`.
- Support `active` and `awaiting_context` Skill states. TODO: add a durable user-visible `off` preference.

### Deferred Skill Work

- Add a `deep-study` Skill after the first router/orchestrator slice is stable.
  - Purpose: deeper analysis of course materials, papers, or chapters.
  - Candidate outputs: concept map, prerequisite knowledge, difficult-point breakdown, examples/counterexamples, chapter connections, and recommended follow-up questions.
  - First implementation should be based on real follow-up button usage rather than speculative prompt design.
- Add follow-up action buttons after normal RAG summaries:
  - `深入追问` or `引导我深入理解` -> use `socratic-tutor` initially.
  - `抓考试重点` -> use `exam-extract`.
  - `生成速记卡` -> use `exam-coach`.
  - `保存为成果` -> use `artifact.save`.
- Keep ordinary file or chapter summaries as normal RAG by default; do not auto-activate a Skill unless the user expresses a more specific study intent.

## Provider-Neutral Tools

### MVP Tools

Implement the first provider-neutral Agent Orchestrator with only these tools:

- `project_files.list`
- `project_files.read`
- `project_rag.search`
- `web.fetch`
- `artifact.save`

### Deferred Tool Expansion

Add these after the MVP loop, approval UX, and tool-result continuation are stable:

- `project_files.delete`
- `artifact.export_docx`
- `reference.add`
- `reference.list`
- `reference.attach`
- `reference.format`
- `arxiv.search`
- `arxiv.read`
- `arxiv.fetch`
- `web.search`

### Deferred Hardening

- Harden approval UX for L2/L3 tools before enabling delete/export/reference operations broadly.
- Migrate legacy non-Orchestrator RAG responses into the Agent Orchestrator path so project-file sources can be persisted and rendered through the same bottom `sources` UI as web/arXiv/artifact sources.
- Add duplicate tool-call detection: stop when the same tool and same args repeat.
- Add no-progress detection: stop when two consecutive rounds produce no useful new tool result.
- Add task-profile round limits:
  - `simple`: max 2 rounds
  - `rag`: max 4 rounds
  - `research`: max 6 rounds
  - `workflow`: max 10 rounds
- Let the Router choose the initial task profile; let the Orchestrator adjust it at most once based on actual tool behavior.
- Add multi-round model-driven continuation. First slice uses deterministic prefetch tools before the final model response; native tool-use continuation is deferred.

## Model Provider Adapters

- Move provider-specific logic out of `src/app/api/chat/route.ts`.
- Add provider adapters that normalize DeepSeek and MiniMax streams into shared internal events.
- Support native tool calling where the provider supports it.
- Add a JSON action fallback for models that do not support native tools reliably.
- Keep DeepSeek built-in `web_search_20250305` only as an optimization path; do not make it the only web access path.
- Make `web.fetch` and future `web.search` server-side product tools so DeepSeek, MiniMax, and future providers can share the same Agent capabilities.

## Routing Details

- Use `RoutingSignals` before keyword scoring.
- Treat Chinese courseware file names as weak signals only; many files are chapter titles or sequence numbers.
- Prefer file category and parse metadata over filename matching.
- Read short snippets or project index summaries only when routing confidence is low.
- Route course-material "抓重点 / 整理考点 / 这章怎么考" requests to `exam-extract`.
- Route time planning, weak-topic review, and sprint planning to `exam-coach`.
- For `paper-reader` missing paper input, use this prompt:

```text
请上传文档、粘贴论文编号（例如 arXiv ID ），或选择项目资料。
```

## Acceptance Checks

- After the Agent Orchestrator iteration is complete, produce a handoff document that explains the before/after diff for the user and future agents. It should cover changed request flow, Skill Router behavior, provider adapters, tool execution, sources persistence, feature flags, remaining TODOs, and verification results.
- Add a local development access setup script before final smoke testing, so a reset database can be made usable without manual registration setup. The script should upsert a test user, set `accessStatus=active`, and optionally configure user-owned API keys for `deepseek`, `minimax`, `mineru`, and `bailian` under `USER_API_KEYS_ENABLED=1` without printing raw keys.
- A normal chapter summary remains regular RAG and does not activate a Skill automatically.
- A paper reading request activates `paper-reader`; missing paper input enters `awaiting_context`.
- A syllabus or exam-point request activates `exam-extract`.
- A review schedule request activates `exam-coach`.
- A code repository request activates `code-reader`.
- A stuck-learning request activates `socratic-tutor`.
- User manual Skill selection or off preference always outranks Router output.
- Router can enable web access automatically when the task clearly requires public external information, but the UI must show that web access is active.
