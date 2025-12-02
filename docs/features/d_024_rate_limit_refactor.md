## D024 – Digital Enterprise Rate-Limit Handling

### Context
- React Strict Mode in dev triggers duplicate `loadStats()` calls, causing `/api/digital-enterprise/stats` to return 429.
- Telemetry must remain accurate (one `graph_load` per successful fetch).
- Prod rate limiter stays intact; changes focus on dev experience and auto-retry.

### Changes
- Add dev-only guard to skip duplicate initial `loadStats()` calls (Strict Mode).
- Convert 429 log to soft warning; honor `retryAfterMs` and auto-retry after the server’s delay.
- Preserve rate-limiter behavior for prod; manual retries bypass the dev guard.
- Ensure telemetry emits a single `graph_load` per successful load; retries only fire `graph_load_error` on failure.

### Verification
- Use `NEXT_PUBLIC_TELEMETRY_DEBUG=true` and confirm a single `graph_load` event per view after retry completes.
- Expect `.fuxi/data/telemetry_events.ndjson` to show one `workspace_view` (already deduped) and one `graph_load` after success; 429s log `graph_load_error`.

### Status
- Implemented on branch `feat/d021_adaptive_ux_impl`.
