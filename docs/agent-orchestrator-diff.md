# Agent Orchestrator Diff

> Date: 2026-06-29

## Summary

This iteration moves chat toward a provider-neutral Agent path while keeping the existing `/api/chat` entry point.

Before:

```text
/api/chat
-> legacy prompt assembly
-> optional legacy RAG context
-> DeepSeek or MiniMax stream
-> limited DeepSeek-only tool loop stub
```

After:

```text
/api/chat
-> Skill Router
-> Agent Orchestrator planned tools
-> DeepSeek or MiniMax stream
-> Message.sources persistence
-> bottom sources UI
```

The first slice uses deterministic prefetch tools before the final model call. Native provider tool-use continuation and JSON action fallback are still TODO items.

## Request Flow

1. `/api/chat` parses the existing request shape.
2. `routeSkill()` classifies intent across all six built-in Skills.
3. `AGENT_ORCHESTRATOR_ENABLED` decides whether the new path is active.
4. When active, legacy RAG pre-concatenation is skipped.
5. `buildPlannedToolCalls()` plans provider-neutral tools:
   - selected files -> `project_files.read`
   - project material task without selected files -> `project_rag.search`
   - explicit public URL -> `web.fetch`
6. `executePlannedToolCalls()` executes tools through the existing policy/audit path.
7. Tool results are added as model context.
8. Sources are persisted on `Message.sources` and rendered below the answer.

## Key Files

- `src/app/api/chat/route.ts`: Skill routing, feature flag, planned tool execution, SSE lifecycle events, source persistence.
- `src/lib/agent/skill-router.ts`: deterministic router for `paper-reader`, `paper-writer`, `exam-extract`, `exam-coach`, `code-reader`, `socratic-tutor`.
- `src/lib/agent/orchestrator.ts`: tool planning, stop conditions, injected tool execution, context construction.
- `src/lib/agent/sources.ts`: source extraction, stable deduplication, source ordering.
- `src/lib/tools/web/fetch.ts`: public URL checks, DNS/redirect SSRF protection, HTML cleanup.
- `src/components/chat/message-bubble.tsx`: bottom source rendering.
- `src/components/chat/chat-area.tsx`: visible Skill, web access, and model adapter status badges from Agent SSE lifecycle events.
- `scripts/seed-dev-access.ts`: reset-db dev user and optional four-provider API key seed.

## Data Model

Added:

- `Conversation.activeSkillId`
- `Conversation.activeSkillVersion`
- `Conversation.activeSkillSource`
- `Conversation.activeSkillStatus`
- `ConversationSkill.source`
- `ConversationSkill.statusAtActivation`
- `ConversationSkill.confidence`
- `ConversationSkill.reason`
- `ConversationSkill.missingInfo`
- `Message.sources`
- `Artifact.metadata`

Migration:

```text
prisma/migrations/20260629152000_add_agent_orchestrator_state/migration.sql
```

## Feature Flags

- `AGENT_ORCHESTRATOR_ENABLED=1`: force new path on.
- `AGENT_ORCHESTRATOR_ENABLED=0`: force legacy path off.
- unset: enabled in development/test, disabled in production.
- `AGENT_DEBUG_EVENTS=1`: emits debug stop-reason events.

## Sources Behavior

Assistant answers do not include inline citations. Sources render at the bottom of the assistant message.

First slice sources are only from the Agent Orchestrator path:

- `web.fetch`
- `project_files.read`
- `project_rag.search`
- `artifact.save`

Legacy non-Orchestrator RAG source migration remains in `docs/TODO.md`.

## Verification

Validation commands passed:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npx prisma validate
```

Result: 73 test files, 248 tests passed. Production build completed successfully with Next.js 16.2.9.

## Remaining TODO

- Add optional DeepSeek fast JSON classifier for low-confidence routing.
- Add UI controls for manual Skill switch/off.
- Add follow-up buttons for deeper Socratic analysis, exam extraction, flashcards, and artifact save.
- Move provider-specific model calls out of `/api/chat` into dedicated adapters.
- Add native tool calling where provider support is reliable.
- Add JSON action fallback for providers without native tools.
- Migrate legacy RAG sources into the unified bottom sources UI.
- Add deeper smoke tests with real DeepSeek and MiniMax keys after local dev access is seeded.
