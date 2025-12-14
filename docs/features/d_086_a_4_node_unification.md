### Directive D086A.4 — Node Grammar Unification

**Objective:**  
Unify node visuals across *Digital Twin* and *Prototype Graph* scenes.  
Adopt the **OMS Prototype Node Grammar** for all node cards to deliver consistent hierarchy, scanability, and domain visual identity.

---

### **Scope**

**Applies to:**  
- `src/components/graph/GraphNode.tsx`  
- `src/app/project/[id]/digital-enterprise/DigitalEnterpriseClient.tsx`  
- `src/app/dev/graph-prototype/page.tsx`

**Does NOT alter:**  
- Data bindings  
- Sequencer logic  
- ALE or ROI/TCC computation  

---

### **Implementation Steps**

#### 1. Extract & Standardize Node Structure
- Base node container = prototype `GraphNode` (6px radius, 1px border, domain color accent).  
- Header row: domain stripe + title (bold 13px).  
- Subtitle: 11px “FY# – Phase”.  
- Footer bar: ROI/TCC signal stripe (4px height).

```tsx
<div className="node-card border rounded-md shadow-sm hover:shadow-md transition">
  <div className="h-1.5 w-full bg-domainAccent" />
  <div className="px-2 py-1.5">
    <h4 className="font-semibold text-[13px] text-foreground">{system.name}</h4>
    <p className="text-[11px] text-muted-foreground">{system.phase}</p>
  </div>
  <div className="h-1 w-full bg-roiSignal" />
</div>
```

---

#### 2. Domain Accent Mapping
| Domain | Color | Tailwind Token |
|---------|-------|----------------|
| Commerce | `#FCD34D` | `amber-300` |
| Finance | `#93C5FD` | `blue-300` |
| Order Management | `#86EFAC` | `green-300` |
| Supply Chain | `#A5B4FC` | `indigo-300` |
| Retail | `#F9A8D4` | `pink-300` |

> Store these mappings in `graphDomainColors.ts`.

---

#### 3. ROI / TCC Signal Logic
| Signal | Color | Description |
|---------|--------|-------------|
| ROI > +50% | `#34D399` | High return |
| ROI between 0–50% | `#FCD34D` | Neutral gain |
| ROI < 0% | `#F87171` | Negative ROI |
| High TCC | `#FCA5A5` | Red tint |
| Low TCC | `#A7F3D0` | Green tint |

> Implement through a computed `roiSignalColor(system)` helper.

---

#### 4. Animation Enhancements
- Hover lift: `translate-y-[-2px]` + shadow softening.  
- Selection: `ring-2 ring-domainAccent ring-offset-1`.  
- ROI change: pulse footer bar using CSS keyframes (duration 1.5s).  

---

#### 5. Apply Globally
- Replace all existing node containers in Digital Twin and Sequencer with unified node grammar.  
- Verify alignment, typography, and domain consistency between both scenes.  

---

### **Acceptance Criteria**
✅ All nodes share identical layout, typography, and accent logic.  
✅ Hover and select states visually consistent across Twin and Sequencer.  
✅ ROI/TCC color bars and phase subtitles readable at all zoom levels.  
✅ Graph remains performant (no added DOM complexity).  

---

**Branch:** `feature/d086a4-node-grammar-unification`  
**Approvers:** Bill (Architect) + dx (Lead Dev)  
**Dependency:** D086A.3 Visual Cohesion Sprint

