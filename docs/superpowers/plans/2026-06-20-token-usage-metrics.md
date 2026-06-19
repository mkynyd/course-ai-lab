# Token Usage Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Settings cache-rate cards with trustworthy 7-day, today, and actual-provider token usage.

**Architecture:** Persist the resolved provider on each assistant `Message`, then aggregate measured assistant `tokenCount` values independently from the existing cache telemetry. Extend the existing metrics response additively and render the new token summary without disturbing existing cache helpers.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 7/PostgreSQL, React Query, Vitest, React 19.

---

### Task 1: Persist the actual response provider

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260620000000_add_message_provider/migration.sql`
- Modify: `src/app/api/chat/route.ts`
- Test: `src/app/api/chat/route.test.ts`

- [ ] **Step 1: Add a failing route assertion**

Extend the successful streaming route test so its mocked `prisma.message.update` must receive `provider: "deepseek"` for a DeepSeek response and `provider: "minimax"` for a MiniMax-routed response.

- [ ] **Step 2: Run the route test and verify failure**

Run: `npm test -- src/app/api/chat/route.test.ts`

Expected: FAIL because `accumulateAndSave` does not persist `provider`.

- [ ] **Step 3: Add the nullable provider column**

Add `provider String?` next to `tokenCount` in `Message` and create this migration:

```sql
ALTER TABLE "Message" ADD COLUMN "provider" TEXT;
```

Run `npx prisma generate` so generated types match the schema.

- [ ] **Step 4: Pass and save the resolved provider**

Add a `provider: "deepseek" | "minimax"` argument to `accumulateAndSave`, pass `modelRoute.provider` from the route, and include `provider` in the assistant update data.

- [ ] **Step 5: Run the route test**

Run: `npm test -- src/app/api/chat/route.test.ts`

Expected: PASS.

### Task 2: Aggregate token usage

**Files:**
- Modify: `src/lib/cache/api-cache-metrics.ts`
- Modify: `src/lib/cache/api-cache-metrics.test.ts`
- Modify: `src/app/api/metrics/cache/route.ts`
- Modify: `src/lib/hooks/use-cache-metrics.ts`

- [ ] **Step 1: Write failing aggregation tests**

Define rows with `createdAt`, `tokenCount`, and nullable `provider`, then assert:

```ts
expect(result).toEqual({
  totalTokens: 420,
  todayTokens: 300,
  requestCount: 3,
  unattributedTokens: 120,
  providers: {
    deepseek: { totalTokens: 200, requestCount: 1 },
    minimax: { totalTokens: 100, requestCount: 1 },
  },
});
```

Also assert that null `tokenCount` rows are excluded from token totals and request counts.

- [ ] **Step 2: Run the metrics test and verify failure**

Run: `npm test -- src/lib/cache/api-cache-metrics.test.ts`

Expected: FAIL because token-usage aggregation does not exist.

- [ ] **Step 3: Implement focused token aggregation**

Add `TokenUsageRow`, `TokenUsageSummary`, and `aggregateTokenUsageRows(rows, todayDate)` to the metrics module. Count only rows with non-null `tokenCount`; include historical rows with null provider in overall and `unattributedTokens`, never in either provider bucket.

- [ ] **Step 4: Query measured assistant messages**

Add `getTokenUsageMetrics(userId, days)` using:

```ts
where: {
  role: "assistant",
  tokenCount: { not: null },
  conversation: { userId },
  createdAt,
}
```

Select `createdAt`, `tokenCount`, and `provider`. Return the aggregation alongside existing cache and export metrics from `/api/metrics/cache` as `tokenUsage`.

- [ ] **Step 5: Extend the client response type and run tests**

Add `tokenUsage: TokenUsageSummary` to `CacheMetricsResponse` and run:

Run: `npm test -- src/lib/cache/api-cache-metrics.test.ts src/app/api/chat/route.test.ts`

Expected: PASS.

### Task 3: Render token usage in Settings

**Files:**
- Modify: `src/components/settings/settings-panel.tsx`
- Create: `src/components/settings/settings-panel.test.tsx`

- [ ] **Step 1: Write a failing component test**

Mock `useCacheMetrics` with `totalTokens: 42100`, `todayTokens: 6100`, DeepSeek usage, and no MiniMax measurements. Assert the panel renders `42.1K`, `6.1K`, the heading `Token 使用情况`, and `--` for MiniMax; assert `Token 命中率` is absent.

- [ ] **Step 2: Run the component test and verify failure**

Run: `npm test -- src/components/settings/settings-panel.test.tsx`

Expected: FAIL because Settings still renders cache rates.

- [ ] **Step 3: Implement compact token formatting and cards**

Add a local formatter that returns integer text below 1,000, one-decimal `K` below 1,000,000, and one-decimal `M` above it. Rename the section to `Token 使用情况`; render 7-day total and today in the main card, and actual-provider totals in the secondary card. Render `--` when a provider `requestCount` is zero.

- [ ] **Step 4: Run the component and targeted tests**

Run: `npm test -- src/components/settings/settings-panel.test.tsx src/lib/cache/api-cache-metrics.test.ts src/app/api/chat/route.test.ts`

Expected: PASS.

### Task 4: Migrate, verify, document, and publish

**Files:**
- Modify if architecture description changes: `REPOSITORY_INDEX.md`
- Modify: `../log.md`

- [ ] **Step 1: Apply the local migration**

Run: `npx prisma migrate dev`

Expected: migration applies and Prisma reports the database is in sync.

- [ ] **Step 2: Run full verification**

Run: `npm test && npm run lint && npm run build`

Expected: all tests pass; lint and build exit 0, with only documented pre-existing warnings if present.

- [ ] **Step 3: Verify in the in-app browser**

Reload `http://localhost:3000/chat`, open Settings, and verify the section shows token usage, compact totals, and `--` for providers without attributable measurements.

- [ ] **Step 4: Update workspace documentation**

Update `REPOSITORY_INDEX.md` only if the Message provider field changes the documented data model. Append a `2026-06-20` entry to `../log.md` listing every modified workspace-relative path and exact verification results.

- [ ] **Step 5: Commit and push only intended changes**

Preserve the pre-existing model-selector edit and incorporate the pre-existing Settings label capitalization only where the new Settings implementation supersedes it. Review `git diff`, stage intended files explicitly, commit with `feat: replace cache rate with token usage metrics`, then push `main`.
