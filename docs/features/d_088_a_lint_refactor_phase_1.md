# 🧩 Merge Plan: Stabilize and Consolidate (D084–D087)

## Step 1️⃣  Clean Working Tree

Check for untracked or staged changes:

```bash
git status
```

Commit everything relevant:

```bash
git add .
git commit -m "chore: finalize Sequencer Scene and stabilize ALE context (D086I)"
```

---

## Step 2️⃣  Run Build Sanity Check

Ensure nothing catastrophic before merge:

```bash
npm run build
```

Ignore harmless telemetry warnings — just ensure it compiles successfully.

---

## Step 3️⃣  Merge Feature Branches

Bring all active branches into `main`:

```bash
git checkout main
git pull origin main

git merge feature/ux-template_refactor
git merge feature/d084c_oms_transformation_graph
git merge feature/org-readiness-engine
```

If DX has any other in-progress branches (e.g. `feature/d086i_sequencer_scene`), merge those as well **without squash** — we want full commit traceability.

---

## Step 4️⃣  Resolve Conflicts

- Keep the **SequencerScene**, **ALE Context**, and **Digital Twin** data rail implementations.
- Delete legacy prototype or `NavSection.tsx` files that conflict.
- Retain **Shadcn-based templates** and **Neutral Light theme**.

Use VSCode merge tools or:

```bash
git mergetool
```

---

## Step 5️⃣  Final Commit + Push

Once conflicts are resolved:

```bash
git add .
git commit -m "merge: consolidate D084–D087 directives and SequencerScene baseline"
git push origin main
```

This will stabilize the repository at a clean reference point: ✅ ALE Context live\
✅ Twin → Sequencer routing stable\
✅ Shadcn + Neutral Light baseline\
✅ No prototype ghosts

---

## Step 6️⃣  Optional Cleanup

Once verified in main, prune abandoned branches:

```bash
git branch -d feature/ux-template_refactor
git push origin --delete feature/ux-template_refactor
```

Repeat for any obsolete branches (e.g. feature/old_graph_prototype).

---

## 🛠️ Optional Automation Script

You can save the following as `scripts/merge_all.sh` for future runs:

```bash
#!/usr/bin/env bash
set -e

BRANCHES=( \
  feature/ux-template_refactor \
  feature/d084c_oms_transformation_graph \
  feature/org-readiness-engine \
  feature/d086i_sequencer_scene \
)

echo "🔍 Cleaning and committing local changes..."
git add .
git commit -m "auto: pre-merge snapshot" || true

echo "🚀 Checking out main and pulling latest..."
git checkout main
git pull origin main

for branch in "${BRANCHES[@]}"; do
  echo "🔄 Merging $branch..."
  git merge $branch || true
done

echo "✅ Finalizing merge"
git add .
git commit -m "merge: consolidate D084–D087 directives"
git push origin main
```

---

📦 **End State:** Once this merge plan completes, the repo will be stable, fully integrated, and ready for next-stage UI refactors or ALE feed enrichment.

---

# 🧩 D088A – Unified Shell & Theme Framework (Neutral Theme)

### 🎨 Theme Revision

A single, neutral white theme applied across the entire app.

```tsx
<ThemeProvider attribute="class" defaultTheme="light">
  <UXShellLayout>{children}</UXShellLayout>
</ThemeProvider>
```

Tailwind config:
```js
colors: {
  background: "#ffffff",
  foreground: "#111827",
  accent: "#2563eb",
  border: "#e5e7eb",
  muted: "#f9fafb",
}
```

---

## Layout Definitions

| Term | Role | Static or Scene-Driven | Source Component |
|------|------|------------------------|------------------|
| **Left Nav** | Global navigation: Projects / Views / Modes / Intelligence | **Static (global)** | `UXShellLayout → Sidebar` |
| **Left Rail** | Scene-specific controls (focus, load data, lenses) | **Scene-driven, collapsible** | Scene-level `<Rail side="left" />` |
| **Right Rail** | Scene-specific insights or panels (Sequencer, ROI) | **Scene-driven, collapsible** | Scene-level `<Rail side="right" />` |
| **Top Nav** | Global bar (user, workspace, theme toggle) | **Static (global)** | `UXShellLayout → TopNav` |
| **Main Stage** | Live scene content (Graph, Sequencer, etc.) | **Scene-driven** | Scene component body |

---

### 🧭 Visual Layout Map

```plaintext
╔══════════════════════════════════════════════════════════════════════╗
║                            GLOBAL SHELL                              ║
║     (ThemeProvider + UXShellLayout govern entire application)         ║
╠══════════════════════════════════════════════════════════════════════╣
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │                        🧭  Top Nav (Global)                    │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║  ┌─────────────┬──────────────────────────────────────────────┬────┐  ║
║  │  📂 Left Nav│                Main Stage                    │📊Right Rail│  ║
║  │  (Global)   │     (Scene Content: Graph, Sequencer, etc.)  │(Scene)│  ║
║  │  Projects    │----------------------------------------------│     │  ║
║  │  Views       │   Scene-specific Left Rail (optional)        │     │  ║
║  │  Modes       │   — Focus, Data, Filters, etc.               │     │  ║
║  │  Intelligence│                                              │     │  ║
║  └─────────────┴──────────────────────────────────────────────┴────┘  ║
║      ⬆ Both Left & Right Rails are collapsible, persistent per user   ║
║                    ⬆ Single Neutral Theme Provider                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

### ✅ Implementation Rules

- **Left Nav** (Projects / Views / Modes / Intelligence) → Always global in `UXShellLayout`.
- **Left Rail & Right Rail** → Declared *only* inside scenes and **must be collapsible**.
- **Top Nav** → Consistent, global component.
- **ThemeProvider** → Declared once at `/app/layout.tsx`.
- **All pages share one layout, one theme, and collapsible rails.**

