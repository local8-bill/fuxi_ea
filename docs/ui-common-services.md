# UI-CommonSvcs Branch -- Implementation Guide

## Scope & Ground Rules

**Scope:**\
Refactor UI + shared components **without changing product behavior**.\
No ingestion changes, no API contract changes.

### Strict Do-Not List

1.  ❌ Do **not** modify:
    -   `/api/digital-enterprise/lucid`
    -   `/api/digital-enterprise/stats`
    -   `parseLucidCsv`
    -   `getStatsForProject` behavior or output shape
2.  ❌ Do **not**:
    -   Introduce new button styles per page\
    -   Re-layout entire pages\
    -   Change any UX flows (uploading, stats loading, etc.)
3.  ❌ No new color palettes or design experiments.

------------------------------------------------------------------------

## Global UI Principles

### Buttons

-   Use **one pill-style primary button** for actions.
-   If a shared `Button` component is added:
    -   Place it at `src/components/ui/Button.tsx`
    -   Variants allowed: `primary`, `secondary`, `ghost` (max).
-   All pages touched in this branch must use the shared button.

### Cards

-   Use a shared `Card` primitive for:
    -   Upload panels\
    -   Metric cards\
    -   Preview blocks\
    -   Any "rounded-2xl border-gray-200" container\
-   No one-off card divs scattered around.

### Typography & Spacing

-   Stick to existing scale:
    -   `text-3xl font-semibold` → page titles\
    -   `text-[0.65rem] tracking-[0.25em]` → section labels\
    -   `text-sm` / `text-xs` for body/microcopy\
-   Never introduce random new typographic values.

------------------------------------------------------------------------

## Implementation Checklist

### Phase 1 -- Core Shared Components (Required)

#### \[ \] 1. `Card` Component

Location: `src/components/ui/Card.tsx`

Wraps all cards in unified styling. Refactor: - Tech Stack page -
Digital Enterprise page

#### \[ \] 2. `MetricCard` Component

Location: `src/components/ui/MetricCard.tsx`

API:

``` tsx
<MetricCard
  label="SYSTEMS"
  value={stats.systemsFuture}
  description="Unique labeled systems..."
/>
```

Refactor all metric card blocks to use this.

#### \[ \] 3. `WorkspaceHeader` Component

Location: `src/components/layout/WorkspaceHeader.tsx`

API:

``` tsx
<WorkspaceHeader
  statusLabel="STATUS"
  title="Tech Stack Workspace"
  description="Upload inventories and diagrams..."
/>
```

Refactor headers on: - Tech Stack - Digital Enterprise

------------------------------------------------------------------------

### Phase 2 -- Upload Panel Unification

#### \[ \] 4. `FileUploadPanel`

Location: `src/components/panels/FileUploadPanel.tsx`

API:

``` tsx
<FileUploadPanel
  title="UPLOAD LUCID CSV"
  helper="Upload a Lucid CSV export..."
  label={uploading ? "Uploading..." : "Upload Lucid CSV"}
  onFileSelected={handleLucidUpload}
/>
```

Refactor Tech Stack upload section to use this.

**Rules:** - Do NOT modify upload logic. - Use existing `FileUpload`
inside the panel.

------------------------------------------------------------------------

### Phase 3 -- Optional (If Time Allows)

#### \[ \] 5. Shared `Button` Component

Only if modifying buttons in touched areas.

Location: `src/components/ui/Button.tsx`

Use variants: - `primary` (default pill) - `secondary` - `ghost`

Refactor buttons only in components refactored in this branch.

------------------------------------------------------------------------

### Phase 4 -- Backend Extraction (Optional & Carefully Done)

#### \[ \] 6. Extract Stats Calculator (No Behavior Change)

Location: - New: `src/domain/services/digitalEnterpriseStats.ts`

Wrap current logic from `getStatsForProject` into:

``` ts
export function calculateDigitalEnterpriseStats(view) { ... }
```

Then:

``` ts
return calculateDigitalEnterpriseStats(view);
```

**Must be 100% behavior-identical.**

------------------------------------------------------------------------

## Note on ui-wireframe

The `ui-wireframe` is **context-only**, not a binding spec.

If wireframe conflicts with: - Live UI\
- Current DE pipeline\
- This checklist

→ **The code wins.**

Do not redesign pages to "match the wireframe."\
Use it only for structural intent (header \> inputs \> metrics \>
detail).

------------------------------------------------------------------------

## Summary

This branch is about: - Consistency\
- Clean reusable components\
- Reducing duplication

NOT about: - Redesign\
- New UX\
- Changing ingestion/stat pipeline

Follow the checklist and we keep the blast radius near zero.
