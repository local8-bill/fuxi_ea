## 2025-11-25 [auth + hardening + persistence]
Summary: Added shared API security helpers (auth + rate limit + JSON error), enforced on all route handlers, capped upload sizes, and added disk persistence for digital enterprise views. Removed OpenAI key logging, fixed Next/Tailwind configs, and expanded ignore rules for shell/env secrets.
Risk: medium
Notes: Configure `MESH_AUTH_TOKEN`/`FUXI_API_TOKEN` (and optionally `NEXT_PUBLIC_FUXI_API_TOKEN` for browser fetches). Digital enterprise data now persists under `.fuxi/data/digital-enterprise` with size limits; monitor for schema impacts. No build/test run yet.

## 2025-11-25 [auth optional toggle]
Summary: Made API auth optional for local/dev via `FUXI_AUTH_OPTIONAL=true|1` so missing tokens no longer block local builds while keeping auth default-on when tokens are set.
Risk: low
Notes: For prod, ensure tokens are set and `FUXI_AUTH_OPTIONAL` is unset/false.
