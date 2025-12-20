# TypeScript Application Architecture Design Doc

## Goal

Design a modern, performance-first TypeScript application architecture for a **heavy Next.js app** deployed on **Vercel**, supporting \~**50 concurrent users**, with **Postgres** and **multi-provider auth** (Microsoft, Google, email/password). The app will likely use its own **Mistral** instance (not OpenAI).

## Principles

- **Performance over purity:** fewer boundaries that matter, not more layers.
- **Clear dependency direction:** UI depends on application; application depends on ports; infrastructure implements ports.
- **Serializable ViewModels:** the server returns typed, cacheable shapes; UI renders.
- **Functional Core, Imperative Shell:** business rules are pure-ish; orchestration is side-effectful.
- **CQRS-lite where it hurts:** separate read models from write workflows.
- **Make expensive work explicit:** background jobs for heavy compilation/simulation.

---

## Architecture Pattern

### 1) Vertical Slice (by capability)

Slice by user-facing capability instead of technical layer:

- Sequencer
- ROI/TCC
- Graph / Asset ingest
- Scenarios
- Auth / User / Org
- Telemetry

Each slice contains:

- **Routes / Server Actions** (imperative shell)
- **Usecases** (core business logic)
- **Ports (interfaces)**
- **Adapters (implementations)**
- **Schemas** (zod/valibot) and **types**

### 2) Functional Core, Imperative Shell

- **Imperative shell**: auth, validation, transactions, calling external systems, logging, retries.
- **Functional core**: deterministic transformations, scoring, sequencing, collision analysis, view-model assembly.

### 3) Hexagonal (Ports/Adapters) — lightweight

- Usecases depend on interfaces (ports) such as `SequenceRepo`, `AssetStore`, `LLMGateway`, `Telemetry`.
- Infrastructure provides implementations (adapters): Postgres, blob storage, Mistral service.

### 4) CQRS-lite

- **Commands** mutate state (write path) and return IDs/status.
- **Queries** return UI-ready **ViewModels** (read path).

---

## “Passing a View” vs “Passing a ViewModel”

### Acceptable

- Server returns a **typed JSON ViewModel** (serializable), e.g. `SequencerVM`, `ConflictVM`, `TimelineVM`.
- UI is a renderer, not an orchestrator.

### Not acceptable (smelly)

- Controllers importing React components.
- Controllers deciding layout.
- “Controller renders the page.”

**Rule:** don’t pass “the view.” Pass **the view model**.

---

## Runtime & Deployment Model (Vercel)

### Rendering

- Prefer **App Router + React Server Components** for data-heavy screens.
- Keep client components small and isolated; use `"use client"` sparingly.

### Server work boundaries

- Use **Server Actions / Route Handlers** to:
  - authorize
  - validate
  - open/commit transactions
  - call usecases
  - return ViewModels

### Caching

- Cache **read models**:
  - per-user (auth scoped)
  - per-sequence / per-scenario
  - per-asset graph version
- Prefer **tag-based invalidation** or **versioned IDs** (cheap, deterministic).

---

## Data Architecture (Postgres)

### Data access

- Use a single DB access layer (Prisma or Drizzle).
- Put transaction boundaries in the imperative shell:
  - `createSequence()` opens a tx, writes, commits, emits telemetry.

### Serverless concurrency constraints

- Connection limits are often the bottleneck.
- Use pooling (Neon/Vercel Postgres pooling / pgbouncer equivalent).

### Read model strategy

- Queries return UI-ready shapes:
  - pre-joined and flattened
  - minimal fields
  - stable shape for caching

---

## Auth

Support:

- Microsoft
- Google
- Email/password

Implementation:

- NextAuth/Auth.js (or equivalent) with adapters to Postgres.
- Treat auth as **infrastructure**; expose only `AuthContext` (user/org/roles) to application.

Key patterns:

- RBAC/ABAC as a thin authorization layer (e.g. `canEditSequence(user, seq)`), not scattered checks.
- Session access only in the shell.

---

## Mistral Integration

### Strong recommendation

Do **not** run inference on Vercel. Run Mistral as a separate service (Fly/ECS/K8s) and call it.

### Port/Adapter pattern

- Port: `LLMGateway` interface
- Adapter: `MistralGateway` with:
  - timeouts
  - retries
  - circuit breaker-ish fallback
  - streaming (SSE) when possible

---

## Background Work

Anything heavy should not run in a request:

- sequence compilation
- collision analysis across many stages
- ROI/TCC simulation sweeps

Pattern:

- enqueue job → return job id → UI polls/streams progress → hydrate viewmodel

---

## Recommended Folder Blueprint

(illustrative; adapt to your repo)

```
/src
  /app
    /(auth)
    /(experience)
  /features
    /sequencer
      /routes
      /actions
      /usecases
      /ports
      /adapters
      /schemas
      /types
      /views  (ViewModel builders)
    /roi
    /graph
    /scenarios
  /domain
    /shared  (cross-feature domain types only)
  /infra
    /db
    /auth
    /telemetry
    /llm
  /lib
    /cache
    /errors
    /logger
```

---

## Contracts

### Command example

- `POST /api/sequences` or server action `createSequence(input)`
- returns `{ sequenceId, status }`

### Query example

- `GET /api/sequences/:id/viewmodel`
- returns `SequencerVM`

---

## Non-goals

- Full DDD ceremony.
- Full CQRS/event sourcing.
- Deep framework abstraction.

---

## Success Criteria

- Pages render fast and predictably under load.
- Heavy computation is off the request path.
- Caching is straightforward and explainable.
- UI is primarily rendering; orchestration lives server-side.
- Changes stay localized to a feature slice.

---

## Open Decisions

- Prisma vs Drizzle
- Queue mechanism (Vercel Queues vs external worker)
- Cache strategy (tag invalidation vs versioning)
- Auth provider choice details (Auth.js config)

