
# Capability Heatmap — Technical Design (Current State)

> Status as of Nov 8, 2025 — lightweight, client-first Next.js app deployed on Vercel. Read‑only visualization; no backend persistence yet.

## 1) Purpose & Scope
Deliver a lightweight web app that visualizes enterprise capabilities as a hierarchical heatmap with computed composite scores and simple weighting.

**Non-goals (for now):** auth, multi-tenant, CRUD, complex theming, rich analytics.

## 2) High-Level Architecture
```
[Next.js (React, App Router)]
   ├─ features/capabilities
   │    ├─ Provider (React Context)
   │    ├─ hooks (useCapabilities, selectors)
   │    └─ view components (L1Heatmap, cards, chips)
   ├─ lib
   │    ├─ scoring (weights, DEFAULT_SCORES, compositeScore, average, types)
   │    └─ colorBand (mapping from score → band)   ← (toggleable; fix pending)
   ├─ app/ (routes, layouts)
   ├─ styles/ (tailwind or CSS modules)
   └─ config/ (env, flags)
[Deployment: Vercel]
```

## 3) Data Model (in-memory)
Hierarchical capability tree (L1 → L2 → L3…). Capabilities have identities, parent/child relations, and score vectors.

```ts
export type Level = 'L1' | 'L2' | 'L3';

export type Scores = {
  fit?: number;  // 0..100
  value?: number;
  risk?: number;
  cost?: number;
};

export type Weights = {
  fit: number;
  value: number;
  risk: number;
  cost: number;
};

export type Capability = {
  id: string;
  name: string;
  level: Level;
  parentId?: string;
  children: string[];
  scores: Scores;
};
```

Canonical structures:
- `roots: Capability[]` — top-level L1 nodes
- `byId: Record<string, Capability>` — O(1) lookup
- `children(id)` derived via `byId[id].children`

## 4) Scoring Engine (`lib/scoring`)
- `DEFAULT_SCORES`, `defaultWeights`
- `average(...numbers): number`
- `compositeScore(scores, weights): number` (0..100)

Aggregation:
- Leaf = `compositeScore(leaf.scores, weights)`
- Non-leaf = average of available child composites (no size weighting yet).

## 5) React State & Context (`features/capabilities/Provider`)
```ts
type CapabilitiesContext = {
  roots: Capability[];
  byId: Record<string, Capability>;
  children: (id: string) => Capability[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  weights: Weights;
  setWeights: (w: Weights) => void;
  compositeFor: (id: string) => number; // memoized; aggregates children
};
```

## 6) UI Composition
- `L1Heatmap` renders cards per L1 with optional quick view rollups.
- Color banding currently off; two-line fix pending (see §10).
- Minimal styling until “done, DONE”.

## 7) Feature Flags & Color Bands
- `colorBand(score)` → `'low' | 'med' | 'high' | 'extreme'`
- Thresholds: `0–49, 50–69, 70–84, 85–100`
- Mapped to token classes; no hard-coded colors.

## 8) Routing & Pages
- Next.js App Router with `/` (Heatmap). Future: `/capability/:id`.

## 9) Configuration
- Build-time env via Vercel (no secrets yet).
- Runtime feature flags via module constants or `NEXT_PUBLIC_*` when needed.

## 10) Known Issues / Near-Term Fixes
1) **Color band re-enable (two-line fix)**
   - Re-export `colorBand` from `lib/scoring/index.ts` **or** change imports to `@/lib/colorBand` in UI components.
2) **Vercel cleanup**
   - Single Production project on `main`; delete stale preview-only projects.
   - Protect envs; consider squash-merge to keep history clean.

## 11) Performance Considerations
- Memoize `compositeFor` with versioned cache.
- Constant-time lookups via `byId`.
- Virtualization not required at current scale.

## 12) Observability
- Console guardrails in dev; optional Vercel Analytics.
- Invariants for tree cycles.

## 13) Testing
- Unit tests for `lib/scoring` (weights, missing dims, NaN guards).
- React tests for `compositeFor` memoization and `L1Heatmap`.
- Snapshot trees; zod contracts when backend lands.

## 14) Security & Privacy
- No PII, no auth yet.
- Avoid leaking secrets via `NEXT_PUBLIC_*`.

## 15) Extensibility Roadmap
- Optional server route `/api/capabilities` returning same shapes.
- What‑if weighting (local drafts vs saved defaults).
- Overlays as non-invasive chips (e.g., sustainability).
- Export CSV/JSON for EA Opportunity Matrix.

## 16) System Diagram (SVG)

![Architecture Diagram](docs/architecture.svg)

### ASCII (reference)
```
┌────────────────────────────────────────────┐
│                User Browser                │
│  React Components → Context → Scoring      │
│  In‑Memory Capability Map                  │
└────────────────────────────────────────────┘
             │  Build / Deploy
             ▼
┌────────────────────────────────────────────┐
│              Vercel Platform               │
│  Static hosting, Edge/API (future)         │
│  SSL, CDN                                  │
└────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│              GitHub + CI/CD                │
│  main → Production; feature/* → Preview    │
└────────────────────────────────────────────┘
```

---

*End of TECHNICAL_DESIGN.md*
