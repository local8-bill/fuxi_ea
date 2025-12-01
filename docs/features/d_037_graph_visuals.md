## Directive D037 — Graph Visualization Optimization

### Purpose

Enhance the *Digital Enterprise (DE) Graph View* for readability, interpretability, and user trust. This directive focuses purely on **visual clarity**, **semantic edge coloring**, and **interaction flow** — no data model or telemetry changes.

---

### 🎯 Goals

- Make dense graphs readable at first glance.
- Convey edge meaning (source type, inference, resolution) through clear color and style.
- Introduce contextual focusing and terminology aids for non-technical users.
- Maintain high performance for large graphs (\u22641k nodes, \u22642k edges).

---

### 1. Adaptive Layout Scaling

- Dynamically scale **rank separation and node spacing** in Dagre layout based on domain count and edge density:
  ```ts
  const spacingFactor = Math.max(100, 20 * domains.length);
  const layout = dagreLayout(nodes, edges, { ranksep: spacingFactor });
  ```
- Dense domains (Commerce, ERP) automatically expand width.
- Low-density domains compress proportionally for visual balance.

---

### 2. Edge Simplification + Highlighting

#### Default Mode:

- All edges use partial transparency and curved routing.
- Simplify intra-domain connections: collapse into single domain-to-domain “aggregate” line.

#### Hover/Focus:

- Highlight related nodes + edges (opacity 1.0).
- Fade unrelated edges (opacity 0.2).
- Tooltip shows upstream/downstream count and type.

---

### 3. Edge Source Coloring (Revised Palette)

| Edge Type         | Meaning                                  | Color                  | Style                       | Visibility                        |
| ----------------- | ---------------------------------------- | ---------------------- | --------------------------- | --------------------------------- |
| 🟦 **Derived**    | Explicit source/target pair found in CSV | `#2563EB` (blue-600)   | **solid 1.5px**             | High contrast                     |
| 🧣 **Inferred**   | Created via fuzzy logic (AI-assisted)    | `#A855F7` (violet-500) | **dashed 1.5px**            | Distinct, tech-oriented           |
| 🥨 **Unresolved** | Dependency unresolved / low confidence   | `#FB923C` (orange-400) | **dotted 2px**              | High contrast; visually prominent |
| ⚫ **Placeholder** | User-added “needs confirmation” edge     | `#374151` (gray-700)   | **dotted 2px, 0.6 opacity** | Clear but subtle                  |

---

### 4. Legend + Graph Key

Add a small bottom-right overlay:

```
⬤ Derived    ⬤ Inferred    ⬤ Unresolved    ⬤ Placeholder
```

- Persistent, semi-transparent background.
- Clicking the legend opens a short “What these mean” modal:
  > “Edges represent system-to-system dependencies or data flows. Color and pattern indicate confidence and origin.”

---

### 5. Focus + Context Interaction

#### Hover:

- Highlight connected edges and fade others.
- Show upstream/downstream counts in tooltip:
  ```
  Oracle EBS
  ↑ 4 upstream   ↓ 6 downstream
  ```

#### Shift+Click:

- Lock focus on node cluster.
- Background dims to 50% opacity to isolate connections.

#### Ctrl+Click:

- Opens *Node Detail Drawer* (if available) with metadata and domain.

---

### 6. Domain Overlay Enhancements

- Increase column padding between domains (min 50px).
- Label columns with sticky headers.
- Allow domain toggle (hide/show individually).
- “Cross-domain only” now dims intra-domain edges rather than removing them.

---

### 7. Edge Source Toggle

Add quick toggle group at top of DE Graph:

```
[ All Edges ] [ Derived Only ] [ Inferred Only ] [ Unresolved Only ]
```

Defaults to **All Edges**, persists user preference in sessionStorage.

---

### 8. Terminology Helper

- Add small 📘 icon near top-right legend.
- On click: show mini sheet defining
  - **Node** → system/application
  - **Edge** → connection/dependency
  - **Upstream/Downstream** → data flow direction
  - **Domain** → functional grouping
  - **Confidence** → harmonization certainty (0–1)

---

### Verification / QA Checklist

| Checkpoint          | Description                                   | Owner   |
| ------------------- | --------------------------------------------- | ------- |
| Layout Scaling      | Graph auto-adjusts spacing per domain count   | Codex   |
| Edge Palette        | All 4 edge types visible + distinguishable    | Fuxi    |
| Legend              | Overlay accurate + modal help opens correctly | Fuxi    |
| Focus Interaction   | Hover/Shift-click behaves per spec            | Codex   |
| Performance         | 1k nodes, 2k edges renders <1.5s              | Mesh QA |
| Cross-domain toggle | Works without visual jump                     | Fuxi    |

---

### Testing Plan

1. Load Deckers dataset with mixed CSV + inferred edges.
2. Toggle between “All” / “Cross-domain” / “Derived Only”.
3. Hover over *EBS* and *OMS* — verify connected systems highlight correctly.
4. Test focus isolation (Shift+Click).
5. Export to PNG → verify orange (Unresolved) stands out clearly.

---

### Branch

`feat/d037_graph_visual_optimization`

### Tag After Completion

```bash
git tag -a v0.6.3-graph-visuals -m "Enhanced DE graph layout, color palette, and edge visibility (D037)"
git push origin v0.6.3-graph-visuals
```

