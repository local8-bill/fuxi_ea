### Directive D070B – Digital Twin View Redesign (Pre-Demo)

**Objective:**  
Transform the existing *Living Map (BETA)* into the unified **Digital Twin View**, built around guided focus and cognitive flow. Simplify the interface, align the agent’s conversational behavior with user motivation, and establish the new experience pattern for analytical exploration.

---

## 1. Purpose
The Digital Twin View introduces the user to their entire enterprise landscape and immediately helps them narrow to the most meaningful area of focus. This page serves as the narrative centerpiece for the Fuxi experience—connecting the data-rich backend (systems, integrations, telemetry) with an anticipatory, human-centered conversation.

---

## 2. Core Flow

### **Step 1: Recognition (Scope Introduction)**
Upon entering the view, the system reveals the full graph with a subtle fade-in animation.

Agent message:
> “Here’s the full picture — every system and integration you’ve shared, harmonized across your enterprise.”

Graph animation:
- Nodes and edges assemble progressively.
- Metric summary above updates live (Systems: 122, Integrations: 95, Domains: 40).

---

### **Step 2: Compression (Ease the Cognitive Load)**
Immediately following the reveal, Fuxi intervenes to prevent overwhelm.

Agent message:
> “It’s a lot, I know. Most enterprises have 100+ systems and thousands of connections.  
Would you like to focus on one area to begin?”

**Focus options:**
1. **By Platform** (ERP, Commerce, CRM, etc.)  
2. **By Domain** (Finance, Supply Chain, Order Management, etc.)  
3. **By Goal** (Modernization, Cost, ROI)

Telemetry:
```json
{ "event": "focus_prompt_shown", "options": ["platform", "domain", "goal"] }
```

---

### **Step 3: Guided Focus (Reframe the Map)**
When the user selects a focus, Fuxi isolates and magnifies the relevant portion of the graph. The agent contextualizes the lens and reframes metrics accordingly.

Example:
> “Perfect — focusing on your commerce ecosystem.  
Would you like me to identify redundancies or modernization opportunities first?”

Graph behavior:
- Non-relevant nodes fade to 20% opacity.
- Center view zooms to relevant cluster.
- Pulse updates dynamically (e.g., Commerce: 14 systems, 32 integrations, overlap 28%).

Telemetry:
```json
{ "event": "focus_selected", "mode": "domain", "value": "Commerce" }
```

---

### **Step 4: Action Invitation (Next Step Pathways)**
Fuxi proposes three contextual next steps, surfaced as conversation cards:

| Action | Description | CTA |
|--------|--------------|------|
| **Analyze Redundancies** | Identify overlapping or duplicate systems. | *Open Redundancy Map* |
| **Assess ROI** | Estimate ROI impact for the current focus. | *Open ROI Dashboard* |
| **Simulate Modernization** | Model the impact of retiring or upgrading systems. | *Open Sequencer* |

Agent phrasing example:
> “Ready to dig in? I can show you where duplication exists, how it impacts ROI, or what your modernization path could look like.”

Telemetry:
```json
{ "event": "action_cards_displayed", "options": ["redundancy", "roi", "modernization"] }
```

---

## 3. Layout Redesign (3-Zone Grid)

| Zone | Purpose | Content |
|------|----------|----------|
| **1. Context Rail** | Conversational context and prompts | Agent messages, suggested focus options |
| **2. Graph Canvas** | Visualization core | React Flow canvas, bounded viewport, fade-in animation |
| **3. Telemetry Pulse** | Real-time stats and signal updates | Readiness, Impact, Confidence metrics |

CSS Grid Template:
```css
grid-template-columns: 280px 1fr 280px;
```

---

## 4. Naming & Visual Standards

| Element | Change |
|----------|--------|
| **Page Title** | “Living Map (BETA)” → **“Digital Twin View”** |
| **Controls** | Replace toggle set with dropdown: *View Mode → ROI, Risk, Modernization* |
| **Animations** | Progressive reveal on entry; focus transition uses 400ms ease-in-out |
| **Telemetry** | Unified namespace: `digital_twin.*` (e.g., `digital_twin.focus_selected`) |

---

## 5. Success Criteria
- ✅ No visible scroll chaos or nested navigation.  
- ✅ Agent guides focus through conversation, not static UI.  
- ✅ Map renders progressively with reduced cognitive load.  
- ✅ User can select focus and navigate to downstream actions (ROI, Sequencer).  
- ✅ Telemetry events fire under `digital_twin.*` namespace consistently.

---

## 6. Next Step
Once verified in demo context, this flow becomes the **anchor user pattern** for:
- Capability Map (D069C)
- ROI Graph transitions
- Sequencer readiness conversations

