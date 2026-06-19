# Token Usage Metrics Design

## Goal

Replace the misleading cache-hit-rate summary in Settings with token usage that is directly supported by persisted chat usage data.

## Settings UI

The existing `Cache` section becomes `Token 使用情况` and shows:

- Total tokens used in the last 7 days as the primary value.
- Tokens used today as a secondary value.
- DeepSeek and MiniMax token totals for the last 7 days.

Values use compact formatting (`42.1K`, `1.2M`). A provider with no attributable usage displays `--`, not `0`, so missing data is not presented as measured zero usage.

Cache hit rate is removed from the primary Settings surface. Cache-specific diagnostics remain available in the existing backend code but are not shown until provider cache telemetry is complete and trustworthy.

## Data Contract

Each assistant message records the provider that actually produced it (`deepseek` or `minimax`) alongside `tokenCount`. The chat route supplies this value from the resolved model route when saving the streamed assistant response.

The metrics endpoint aggregates assistant messages owned by the current user:

- `totalTokens`: sum of `tokenCount` for the selected period.
- `todayTokens`: sum since the start of the current UTC day, matching the existing server-side date aggregation convention.
- `providers.deepseek.totalTokens` and `providers.minimax.totalTokens`: sums grouped by the recorded actual provider.
- `requestCount`: assistant messages with measured token usage.

Historical rows without an actual provider remain unattributed. They contribute to overall totals but not provider totals; no potentially incorrect backfill is performed from `Conversation.model` or the conversation's current `modelLock`.

## Compatibility and Failure Handling

- Keep the existing authenticated metrics endpoint URL and query parameter.
- Preserve existing cache metric helpers for non-UI consumers.
- Extend the endpoint response additively with token-usage fields.
- If the endpoint fails, retain the current loading and error states.
- Null `tokenCount` values do not count as measured usage.

## Verification

- Unit-test aggregation for overall, today, provider, null-token, and unattributed historical rows.
- Verify the chat persistence path writes the actual routed provider.
- Run the targeted tests, full test suite, lint, and build.
- Verify the Settings dialog in the in-app browser at `http://localhost:3000/chat`.
