## 🧭 Directive D085E — Transformation Lens Filtering

### 🎯 Objective
Introduce a **Transformation Lens** system that dynamically filters and clusters nodes within the Digital Twin Graph based on program, phase, or scenario context.  
This enables users to move seamlessly between macro (enterprise-wide) and micro (initiative-specific) views — foundational for future “Saved View / Scenario” functionality.

---

### 🧩 Scope

| Layer | Artifact | Purpose |
|--------|-----------|----------|
| **Graph Engine** | `/components/graph/TransformationLens.tsx` | Contextual filter controller for nodes & domains |
| **UI Control** | `ViewModeSelector.tsx` | Adds new toggle options (Global / Program / Scenario) |
| **State Hook** | `/hooks/useTransformationLens.ts` | Centralizes lens state + persistent filter logic |
| **Data Model** | `/api/digital-enterprise/view` | Supplies domain-program mapping for dynamic filtering |
| **Persistence** | `/api/user/views` *(future)* | Optional endpoint for saving user-defined lenses |

---

### 🧱 Core Concept
Each **lens** defines a *contextual subset* of the enterprise graph, reducing cognitive load and enabling precision analysis.

#### Lens Types

| Lens Type | Description | Example |
|------------|--------------|----------|
| **Global Lens** | Full harmonized enterprise graph | Everything visible (default) |
| **Program Lens** | Systems & integrations within a major transformation domain | OMS, MFCS, CRM, Finance, etc. |
| **Scenario Lens** | User-saved filtered state combining domains, systems, and timeline | *“Canada B2B/B2C Rollout”* or *“EBS Decommission Path”* |

---

### ⚙️ Functional Flow

```bash
[Digital Enterprise API]
     ↓
useTransformationLens (applies filters)
     ↓
TransformationLens.tsx (renders visible subset)
     ↓
GraphCanvas (updates layout + color coding)
```

**UI Toggle:**  
Located in `ViewModeSelector` alongside *Systems / ROI / Sequencer / Capabilities*.

```tsx
<ViewModeSelector>
  {['Systems', 'ROI', 'Sequencer', 'Capabilities', 'Transformation Lens']}
</ViewModeSelector>
```

---

### 🧠 Behavior
- When switching to a **Program Lens**, non-relevant nodes fade to 10–20% opacity.  
- Integration edges persist only if both nodes are visible under the active lens.
- ALE reasoning weights (ROI, TCC, Confidence) recalculate to reflect filtered scope.
- Sequencer predictions and Decision Backlog dynamically adjust to the active lens subset.

---

### 🧾 Example Configuration

```json
{
  "lens": "OMS",
  "domains": ["Order Management", "Commerce", "Finance"],
  "systems": ["DOMS on AWS", "MFCS", "EBS"],
  "integrations": ["OrderSync_v2", "InvoiceFlow_v1"],
  "focus_phase": "FY26"
}
```

---

### 🧩 Integration with Future Scenarios
The **lens system** doubles as a foundation for *Saved Views* (forthcoming D086 series):
- Each applied lens state can be serialized as a JSON object.
- Saved views become retrievable via `/api/user/views`.
- Enables “switching contexts” instantly between programs, pilots, and enterprise states.

---

### 🧭 Visual Diagram: Lens Modes

```
+-------------------+          +--------------------+          +----------------------+
|  GLOBAL LENS      |  --->    |  PROGRAM LENS       |  --->    |  SCENARIO LENS         |
|-------------------|          |--------------------|          |----------------------|
| All domains       |          | Filtered programs  |          | User-defined states  |
| All integrations  |          | OMS / MFCS only    |          | e.g. Canada rollout  |
| Full ROI/TCC view |          | Scoped reasoning   |          | Sequencer snapshot   |
+-------------------+          +--------------------+          +----------------------+
```

---

### ✅ Completion Criteria
- New **Transformation Lens** toggle available in `ViewModeSelector`
- Switching lenses updates GraphCanvas and Sequencer context
- Non-relevant domains fade visually; ALE data recalculates dynamically
- Lens state stored in `useTransformationLens` and persists across sessions
- Example program lens (`OMS`) verified with Deckers dataset

---

**Branch:** `feature/d085e_transformation-lens`  
**Approvers:** Bill (Agent Z), dx  
**Dependencies:** D084C (Graph), D085A (Sequencer), D085B (dx Monitor)  
**Next:** D086A — *Saved Views & Scenario Snapshots*