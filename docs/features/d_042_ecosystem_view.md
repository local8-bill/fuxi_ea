## Directive D042 — Ecosystem View Integration (Addendum: Visual Polish & Fit-to-Space)

### Purpose
Enhance the usability and visual fluidity of the **Ecosystem View** by introducing responsive scaling, fit-to-space rendering, and refined visual hierarchy — while maintaining existing controls for backward compatibility.

---

### 1. Layout Responsiveness & Fit-to-Space
- Implement a **Fit-to-Space** model on initial render and when toggling between layout types (SBGN, CoSE, Dagre, Concentric):
  ```ts
  cy.fit(undefined, 50); // Padding ensures edges remain visible
  ```
- Enable smooth auto-scaling when window or container resizes.
- Ensure domain compound boxes expand dynamically to encompass nodes as layouts change.
- Prevent node overlap in dense graphs by auto-adjusting node spacing via layout config:
  ```ts
  nodeSpacing: node => 60 + (node.degree() * 5)
  ```

---

### 2. Visual Polish Checklist
| Area | Update | Notes |
|------|---------|-------|
| **Domain Containers** | Add subtle drop-shadow (rgba(0,0,0,0.08)) and internal padding | Improves legibility and separation |
| **Node Glow** | Use `box-shadow: 0 0 10px rgba(255,255,255,0.7)` on hover | Adds clarity and focus for hovered nodes |
| **Edges** | Slight curvature (curve-style: bezier, control-point-step-size: 30) | Reduces edge stacking on cross-domain links |
| **Edge Width** | Scale with confidence level: `width: 1 + (confidence * 1.5)` | Conveys certainty visually |
| **Text Scaling** | Node labels auto-scale within 10–14px range | Ensures readability across screen sizes |
| **Color Hierarchy** | Darken domain headers slightly (#1f2937) | Improves contrast with translucent backgrounds |
| **Background** | Neutral off-white (`#f9fafb`) with grid dots (opacity 0.05) | Subtle structure cue without clutter |
| **Legend Overlay** | Fixed bottom-right; blurred translucent background | Keeps color mapping legible on any layout |

---

### 3. Existing Controls (Retain for Now)
Retain all top-level buttons and layout toggles currently present in the Digital Enterprise page:
```
[ SBGN ] [ CoSE ] [ Dagre ] [ Concentric ] [ + Zoom ] [ – Zoom ] [ Fit ]
```
- These will remain during transition to `/ecosystem`.
- Future refactor (post-D042) will consolidate redundant controls and introduce context-aware toolbars.

---

### 4. Fit View Enhancements
- On every graph load, automatically trigger **cy.fit()** and store the resulting bounding box in state.
- Add keyboard shortcut `Shift+F` for manual fit.
- Adjust export renderer to use bounding box dimensions for consistent framing across PNG/PDF outputs.

---

### Verification Checklist
| Test Case | Expected Outcome |
|------------|------------------|
| Resize browser window | Graph re-centers with proportional scaling |
| Toggle layout (SBGN → CoSE → Dagre) | Fit-to-space auto-applies each time |
| Hover over node | Glow visible, text legible, edges fade subtly |
| Export PNG/PDF | Layout matches viewport framing; no cropped nodes |
| Domain container with 10+ nodes | Expands evenly; labels remain readable |

---

### Branch
`feat/d042_ecosystem_view-polish`

### Tag After Completion
```bash
git tag -a v0.6.4b-ecosystem-polish -m "Responsive fit-to-space scaling, visual polish, and node glow enhancements for Ecosystem View (D042 Addendum)"
git push origin v0.6.4b-ecosystem-polish
```

