### Directive D070B – Digital Twin View Redesign (Pre-Demo)

**Objective:**  
Transform the existing *Living Map (BETA)* into the unified **Digital Twin View**, built around guided focus, progressive reveal, and a calm, intelligent visual hierarchy. This directive defines both the conversational flow and the visual behavior for the demo-ready implementation.

---

## 1. Purpose
The Digital Twin View introduces the user to their entire enterprise landscape, then helps them narrow to the most meaningful area of focus. It’s the anchor experience connecting data, insight, and anticipatory interaction — balancing intelligence with clarity.

---

## 2. Core Flow

### Step 1: Recognition (Scope Introduction)
Agent reveals the graph progressively, acknowledging the scale.

> “Here’s the full picture — every system and integration you’ve shared, harmonized across your enterprise.”

Graph animation: nodes and edges fade in layer-by-layer, showing systems, integrations, and domain groupings.

Telemetry:
```json
{ "event": "digital_twin.render_start" }
```

---

### Step 2: Compression (Ease the Cognitive Load)
Agent immediately guides focus to prevent overwhelm.

> “It’s a lot, I know. Most enterprises have 100+ systems and thousands of connections.  
Would you like to focus on one area to begin?”

Focus options:
- **By Platform** (ERP, Commerce, CRM, etc.)  
- **By Domain** (Finance, Supply Chain, etc.)  
- **By Goal** (Modernization, Cost, ROI)

Telemetry:
```json
{ "event": "focus_prompt_shown", "options": ["platform", "domain", "goal"] }
```

---

### Step 3: Guided Focus (Reframe the Map)
When a focus is selected, the graph zooms and fades irrelevant nodes.

> “Perfect — focusing on your Commerce ecosystem.  
You have 14 systems and 32 integrations here. Would you like to explore redundancies or modernization first?”

Graph behavior:
- Fade irrelevant nodes to 15% opacity
- Zoom and center on cluster
- Update pulse metrics dynamically

Telemetry:
```json
{ "event": "digital_twin.focus_selected", "mode": "domain", "value": "Commerce" }
```

---

### Step 4: Action Invitation (Next Step Pathways)
Agent presents contextual next actions:

| Action | Description | Route |
|--------|--------------|-------|
| **Analyze Redundancies** | Identify overlapping or duplicate systems | `/experience?scene=redundancy` |
| **Assess ROI** | Quantify value for this focus area | `/experience?scene=roi` |
| **Simulate Modernization** | Model the impact of retiring or upgrading systems | `/experience?scene=sequencer` |

> “Ready to dig in? I can show you where duplication exists, how it impacts ROI, or what your modernization path could look like.”

Telemetry:
```json
{ "event": "digital_twin.actions_shown", "options": ["redundancy", "roi", "modernization"] }
```

---

## 3. Visual & Layout Redesign

### 3.1 Layout Zones
```
--------------------------------------------
| [Global Topbar - fixed]                  |
--------------------------------------------
| Context Rail | Graph Canvas | Insights  |
--------------------------------------------
```

CSS Grid:
```css
grid-template-columns: 280px 1fr 280px;
grid-template-rows: 56px auto;
```

### 3.2 Visual Standards
| Element | Spec |
|----------|------|
| **Page Title** | Rename from *Living Map (BETA)* → **Digital Twin View** |
| **Graph Style** | Dark-on-slate canvas with glow highlights |
| **Controls** | Single dropdown for *View Mode: ROI / Risk / Modernization* |
| **Animations** | 400ms ease-in-out transitions for focus, 200ms per-layer reveal |
| **Telemetry Namespace** | `digital_twin.*` |

### 3.3 Color & Hierarchy
- Background: `#101214` gradient to `#1C1C1E`
- Node Highlight: `#FFD166`
- Agent Bubble: glass panel, subtle blur, top-left anchor
- Insights Rail: translucent with metrics (Readiness, Impact, Confidence)

---

## 4. Agent Behavior
- Agent acts as *navigator*, not chatter.  
- Prompts are short and anticipatory, always ending in an action.  
- Tone: calm, confident, mentor-style guidance.

Fallback copy:
> “I can filter the map to help you focus — by domain, by platform, or by your goal. Which should we start with?”

---

## 5. Success Criteria
| Goal | Definition of Done |
|------|--------------------|
| **Progressive Reveal** | Graph animates in visible layers |
| **Guided Focus** | Agent narrows scope through dialogue |
| **Visual Calm** | Single dropdown + minimal UI noise |
| **Consistent Layout** | Fixed topbar, three-zone grid |
| **Action Flow Ready** | Pathways to ROI, Sequencer, and Redundancy scenes |
| **Telemetry Active** | `digital_twin.*` events emitted consistently |

---

## 6. Post-Demo Readiness Plan
Once validated in demo:
- Expand focus models to include *capability mapping* (D069C)
- Link Digital Twin View selections to ROI/TCC attribution
- Integrate real-time agent insights (“Fuxi observed system overlap risk ↑ 12% in Finance”)

This finalized version merges both **flow behavior** and **visual hierarchy**, defining the full demo-ready Digital Twin experience.

