## D041 Addendum — SBGN Stylesheet Integration

### Purpose
Integrate **cytoscape-sbgn-stylesheet** to provide a cleaner, more structured, scientific-style layout for Digital Enterprise graphs. This addendum focuses on **visual overhaul only** — no changes to data or harmonization logic.

---

### 1. Installation
Run the following in project root:

```bash
npm install cytoscape-sbgn-stylesheet
```

*(Alternative: `yarn add cytoscape-sbgn-stylesheet`)*

---

### 2. Import
Update `src/components/DigitalEnterpriseCyto.tsx` (or wherever the Cytoscape instance is initialized):

```ts
import cytoscape from "cytoscape";
import sbgnStyle from "cytoscape-sbgn-stylesheet";
```

---

### 3. Apply Stylesheet
Replace or augment the current style initialization with:

```ts
const cy = cytoscape({
  container: document.getElementById("cy"),
  elements: graphElements,
  style: sbgnStyle(cytoscape), // Apply SBGN stylesheet
  layout: { name: "sbgn", fit: true, padding: 60 },
});
```

This activates the **SBGN visual grammar**: compound nodes, crisp monochrome lines, rounded shapes, and edge arrows.

---

### 4. Optional Domain Coloring (Preserve Context)
After applying the SBGN stylesheet, add simple domain-based coloring:

```ts
cy.style()
  .fromJson(sbgnStyle(cytoscape))
  .selector("node[domain = 'Finance']")
  .style({ "background-color": "#e0f2fe" })
  .selector("node[domain = 'Commerce']")
  .style({ "background-color": "#fff7ed" })
  .update();
```

This ensures Finance, Commerce, etc. remain visually distinct while staying true to the SBGN aesthetic.

---

### 5. Reversal Plan
If the team decides to revert this visual overhaul:

1. Remove the import:
   ```ts
   import sbgnStyle from "cytoscape-sbgn-stylesheet";
   ```
2. Replace the Cytoscape initialization style back to the custom JSON stylesheet (D037).
3. Re-run `npm uninstall cytoscape-sbgn-stylesheet` to clean dependencies.

---

### 6. QA Checklist
| Checkpoint | Expected Behavior | Owner |
|-------------|------------------|--------|
| Install success | Package resolves without warnings | Codex |
| Layout | Default layout = SBGN, fit on load | Fuxi |
| Domains | Finance/Commerce retain tint overlays | Fuxi |
| Performance | < 1.5s render for ≤100 nodes | Mesh QA |
| Revert test | Style reverts cleanly to D037 if removed | Codex |

---

### 7. Tag After Verification
```bash
git tag -a v0.6.4-sbgn-visuals -m "Integrate SBGN stylesheet for Cytoscape (D041 Addendum)"
git push origin v0.6.4-sbgn-visuals
```