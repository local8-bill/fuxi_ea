## 🎨 Directive D082A – Graph Visual Prototype (Layout & Guided Focus)

### Objective
Define the **visual and structural foundation** of the Fuxi Graph — the interactive digital twin canvas within the Experience Shell. This prototype focuses on *layout, interaction rhythm, and guided focus hierarchy*, not data or logic.

---

### 🧭 Design Philosophy
The graph should feel **alive yet calm**, guiding users from complexity to clarity. It’s not a diagram; it’s a living workspace for understanding systems, domains, and change.

---

### 🧱 Layout Structure (Iteration 1 – Spatial Grammar)

```
 --------------------------------------------------------------
| [Guided Focus]  By Domain | By Goal | By Stage               |
| [View Mode ▼]  Systems | ROI | Sequencer | Capabilities       |
|--------------------------------------------------------------|
|                                                              |
|                   [GRAPH CANVAS AREA]                        |
|                                                              |
|      • Nodes grouped by Domain or Stage                      |
|      • Smooth pan + zoom + inertial scrolling                |
|      • Optional mini-map (bottom-right)                      |
|                                                              |
| [EAgent Overlay] small pulses + focus highlights             |
|                                                              |
 --------------------------------------------------------------
```

**Guided Focus (top left):** defines *what* the user explores.
**View Mode (top right):** defines *how* the user views it.

---

### 🎛 Guided Focus Options
| Focus Type | Description | Default Behavior |
|-------------|--------------|------------------|
| **By Domain** | Clusters by business function (Commerce, Finance, Supply Chain). | Stage 0 load view (Orientation). |
| **By Goal** | Highlights systems tied to strategic objectives (Modernize, Reduce Cost, Improve Experience). | ROI overlay color scheme. |
| **By Stage** | Filters by transformation phase (Current → Near-Term → Future). | Syncs with Sequencer timeline bands. |

---

### 👁️ View Modes
| Mode | Description | Visual Treatment |
|------|--------------|------------------|
| **Systems View** | Shows systems + integrations (current/future). | Flat color + integration lines. |
| **Domain View** | Clusters by business value streams. | Soft pastels, domain halos. |
| **ROI View** | Displays impact vs. cost. | Gradient heatmap overlay. |
| **Sequencer View** | Adds time phase layers. | Horizontal stage bands with node animation. |
| **Capabilities View** | Capability hierarchy and scoring overlays. | Color + size reflect score. |

---

### 🌗 States of Reveal
| State | Name | Default Visible | Emotional Tone |
|--------|------|------------------|----------------|
| 0 | **Orientation** | Domains only | Calm, elegant |
| 1 | **Exploration** | Nodes per domain, faint edges | Curious |
| 2 | **Connectivity** | All systems + integrations | Energized |
| 3 | **Insight** | Overlays (ROI, TCC, Scoring) | Analytical |

> Integrations are **hidden by default**; users (or EAgent) can toggle visibility.
> EAgent can narrate transitions (“Would you like to see connections between systems?”).

---

### 🎨 Core Visual Treatments
- **Background:** muted gray/blue gradient; low contrast.
- **Nodes:** rounded-2xl, soft glow on hover, subtle category tint.
- **Edges:** Bezier curves, low opacity; highlight on hover.
- **Clusters:** domain halos with title labels.
- **Mini-map:** optional; double-click resets view.

---

### 💬 EAgent Integration
EAgent communicates through subtle overlays and short messages near the focus area.

**Examples:**
- “I’ve highlighted your Commerce domain.”
- “You’re now viewing dependencies for Finance systems.”
- “ROI view activated — showing high-impact zones.”

---

### 🧩 Interaction Grammar
| Gesture | Result |
|----------|--------|
| Click | Select node or domain; open detail panel |
| Shift + Click | Multi-select for grouping |
| Cmd/Ctrl + Drag | Pan canvas |
| Scroll / Pinch | Zoom |
| Right Click | Context menu (highlight, group, hide, score) |
| Double-click Cluster | Zoom to fit cluster |
| ESC | Deselect all |

---

### 🧠 Telemetry Targets
- `graph_focus_changed`
- `graph_mode_changed`
- `graph_stage_revealed`
- `graph_interaction` (drag, zoom, select)

---

### ✅ Deliverable (Iteration 1)
- Static, data-light prototype under `/dev/graph-prototype`.
- Mock JSON data for 3–5 domains.
- No API calls — pure UX exploration.
- Must demonstrate:
  - Guided Focus tile interaction.
  - View Mode control.
  - Stage 0–3 Reveal transitions.

---

### 🧭 Next Iterations
- **Iteration 2:** Animation & reveal timing.
- **Iteration 3:** Guided Focus + EAgent dialogue integration.
- **Iteration 4:** Behavioral polish + learning telemetry.
- **Iteration 5:** ALE-driven adaptation.

---

**Branch:** `feature/d082a_graph_visual_prototype`
**Approvers:** Fuxi & Agent Z (Bill)
**Purpose:** Lock visual grammar and interaction rhythm before data and ALE integration.

