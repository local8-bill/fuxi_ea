# D053: Digital Twin Interface Wireframe

## 1. The Twin Cockpit Layout

**Purpose:** Provide a unified interface where the architect perceives, simulates, and learns from the enterprise digital twin.

### Layout Overview
```
+--------------------------------------------------------------------------------+
| Insights / Conversation Panel        |                                          |
|--------------------------------------+                                          |
| AI Voice of the Twin:                |                                          |
| "Here’s what changed since your last session." |          Living Map (ReactFlow)     |
|                                      |          (Core Twin Graph)                |
|                                      |                                          |
|                                      |                                          |
|--------------------------------------+------------------------------------------|
| Time Sequencer & ROI Controls | Domains | Simulation Layers | Telemetry Pulses |
+--------------------------------------------------------------------------------+
```

### Components
- **Living Map (Center):** Interactive React Flow graph visualizing domains and systems as the spatial layer of the twin.
- **Insights Panel (Left):** Conversational AI channel narrating context, decisions, and impacts.
- **ROI / Timeline Bar (Bottom):** Temporal layer to explore transformations and break-even milestones.
- **Pulse Strip (Top/Right Overlay):** Real-time indicators of data flow, cost accrual, and telemetry events.

---

## 2. Modal Depth (Simulation Modes)

| Mode | Focus | Interaction | Visual Cue |
|------|--------|--------------|-------------|
| **Architecture Mode** | Structure & dependencies | Hover for lineage, click to expand domains | Neutral theme (gray/blue) |
| **Transformation Mode** | Change sequencing | Drag stage markers, simulate parallel initiatives | Dynamic stage colors |
| **Finance Mode** | ROI & cost projections | Slide time, adjust cost multipliers | Gradient from red (cost) → green (profit) |
| **Risk Mode** | Stability and readiness | Pulse overlay: risk hotspots glow | Amber overlays & wave pulses |

---

## 3. Digital Pulse (Real-Time Feedback)

The twin should *feel alive* — a responsive organism.

- **Telemetry Indicators:** Icons flash when data or relationships update.
- **ROI Streamline:** Thin animated line flows between systems showing cost/benefit propagation.
- **Heartbeat Loop:** Subtle background motion every few seconds, signaling active simulation.

*Interaction Goal:* Architects sense systemic balance or stress visually — not numerically.

---

## 4. The Conversation Layer (“The Twin’s Voice”)

> The Twin is your partner. It doesn’t talk *at* you — it reasons *with* you.*

- Contextual AI prompts: _"It looks like ERP modernization affects 4 domains — shall I show dependency impacts?"_
- Inline graph highlights respond to dialogue.
- Teach-back loops: Twin explains its reasoning (“I calculated ROI using your stage-2 data.”)
- Supports natural commands: _"Show me integration risk for Q3."_

*Tone:* Calm, factual, yet collaborative. Every insight invites discovery, not overwhelm.

---

## 5. Interaction Gestures

| Action | Gesture | Outcome |
|---------|----------|----------|
| **Explore** | Scroll / Pan / Zoom | Navigate spatial twin graph |
| **Focus** | Click a domain or system | Opens contextual card (metrics, cost, dependencies) |
| **Simulate** | Drag stage markers or sliders | Replays transformation over time |
| **Inspect** | Hover | Reveals tooltips, domain pulse, connection summaries |
| **Ask** | Type or say command | Activates Twin reasoning (ROI calc, dependency trace, what-if) |

---

## 6. Emotional Language & Experience Goals

| Moment | Emotion | UI/UX Expression |
|---------|----------|------------------|
| **Upload Complete** | Relief → Curiosity | “Your digital twin is initializing…” with subtle animation |
| **Graph Alive** | Awe → Control | Nodes animate smoothly into layout, edges pulse with energy |
| **Simulation Running** | Focus → Empowerment | Stage markers glow, ROI panel updates in sync |
| **ROI Revealed** | Satisfaction → Confidence | Clean chart, clear break-even, smart annotation |
| **Session Return** | Recognition → Trust | Twin greets user: “Here’s what’s changed in your ecosystem.” |

---

## 7. Key Visual Wireframes

1. **Twin Cockpit (Default View)**  
   Living Map centered, timeline bottom, insights left, pulse top-right.

2. **Transformation Simulation View**  
   Time slider active; changing stage updates color gradients in real-time.

3. **ROI Analysis View**  
   Twin focuses on economic feedback: cost-benefit lines, tooltip explanations.

4. **Conversation Focus View**  
   Chat panel expands; twin narrates key transformations, impacts, and outcomes.

---

## 8. Immediate Next Step

Integrate D053 layout structure into project `/project/[id]/digital-enterprise` UI skeleton under React Flow engine toggle.  
Codex should use this as visual + interaction blueprint once D052 explainer context is fully understood.

