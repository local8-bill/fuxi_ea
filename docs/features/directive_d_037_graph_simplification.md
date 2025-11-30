## Directive D037 — Graph Simplification & Visual Clarity Pass

### 🎯 Objective
Refine the Digital Enterprise visualization and harmonized graph output to ensure clarity, reduce noise, and emphasize meaningful insights. This directive focuses entirely on improving readability, interpretability, and user control over complexity.

---

### 🧩 Core Problems Identified
1. **Visual clutter** due to redundant systems, vague domain labels, and excessive edge density.
2. **Low-confidence matches** flooding the view with questionable harmonization results.
3. **Inconsistent naming** (e.g., “OMS,” “Order Mgmt,” “Order Management”) leading to fragmented nodes.
4. **Unbounded domain spread** producing wide, unreadable layouts.
5. **Overloaded visualization**—no filtering or progressive disclosure for high-volume systems.

---

### 🧠 Solution Overview
Introduce a post-harmonization **semantic cleanup and filtering layer**, along with user-facing controls for simplifying the view.

| Layer | Enhancement | Description |
|-------|--------------|--------------|
| **Harmonization Post-Processor** | `cleanHarmonizedGraph()` | Applies alias merging, deduplication, and domain normalization on harmonized data before serving to DE view. |
| **Alias Merge Engine** | `mergeAliases()` | Merges systems with similar names using fuzzy logic (≥0.85 similarity). E.g., merges “OMS,” “Order Mgmt,” and “Order Management.” |
| **Domain Normalization** | `normalizeDomain()` | Auto-assigns domains for systems labeled “Other” by keyword detection in description or system name (e.g., “Inventory,” “SKU,” “POS”). |
| **Confidence Filter** | Graph-level filter | Default display hides nodes and edges with <0.6 confidence unless user toggles “Show All.” |
| **Edge Deduplication** | Graph refinement | Removes duplicate (source,target) edge pairs; merges directional duplicates into a single unified connection. |
| **Progressive Disclosure** | Collapsible domains | Only top 8 domains displayed by default; others grouped under an expandable “Other” column. |
| **Visual Simplify Toggle** | `Simplify View` | User-facing button to toggle low-confidence/alias-hidden nodes and condensed edge rendering. |
| **Color by Confidence** | Visual hint | Nodes colored by confidence (green >0.75, yellow 0.5–0.75, red <0.5). |

---

### 🖥️ UX Adjustments
- Add **“Simplify View”** and **“Show All”** toggles in the DE header.
- Add **confidence legend** under domain bar.
- Replace static domain grid with a **collapsible layout**.
- Implement smooth transitions when expanding/collapsing domains.
- Tooltip on hover shows: `system_name`, `domain`, `confidence`, and `state`.

---

### 🧪 QA & UAT Checklist

| Test | Description | Expected Outcome | Verified By |
|------|--------------|------------------|--------------|
| 1. Alias Merge | Verify similar system names merge correctly. | OMS variants collapsed to one node. | Fuxi |
| 2. Confidence Filter | Toggle shows/hides low-confidence nodes. | Default hides <0.6 confidence. | Codex |
| 3. Domain Normalization | Systems without domain auto-classified. | Reduces “Other” count by ≥60%. | Fuxi |
| 4. Edge Deduplication | Duplicate connections removed. | Edge count reduction confirmed. | Codex |
| 5. Simplify View | User toggle switches between full and simplified views. | Smooth transition, <1s render time. | Fuxi |
| 6. Performance | Rendering large graph (500+ nodes). | Maintains <1.5s initial load. | Mesh |

---

### ⚙️ Implementation Notes
- Apply cleanup in `src/domain/services/harmonization.ts` after merge step.
- Adjust `/api/digital-enterprise/view` to call `cleanHarmonizedGraph()` before responding.
- Add optional query params: `?mode=simplified` and `?min_confidence=0.6`.
- Add telemetry: `graph_cleanup_applied`, `simplify_view_toggle`, `domain_expand_toggle`.

---

### 📈 Branch & Tag
Branch: `feat/d037_graph_simplification`

Tag after QA pass:
```bash
git tag -a v0.7.5-graph-simplification -m "Directive D037 — Graph Simplification & Visual Clarity Pass"
git push origin v0.7.5-graph-simplification
```

---

### Status
Status: 🚧 In Progress  
Next Action: Codex to implement post-harmonization cleanup functions and UI toggles.  
QA Target: Validate simplified visual output with real artifact data before next feature freeze.

