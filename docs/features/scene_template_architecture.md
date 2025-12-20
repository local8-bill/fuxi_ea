## **D089O Addendum — Navigation & Rail Visibility Cleanup**

---

### **1. Left Navigation (Unified Structure)**
Adopt the updated taxonomy:

```
PROJECTS
MODES
  ├── Digital Twin
  ├── Sequencer
  ├── ROI / TCC
  ├── Insights
  └── Review
ROLES
  ├── Architect
  ├── Analyst
  ├── CIO
  ├── CFO
  └── Transformation Lead
INTELLIGENCE
  ├── Signals
  ├── Telemetry
  └── ALE Context
```

✅ *Implement as persistent accordion groups in the UnifiedShell left nav.*

---

### **2. Right Rail — Conditional Rendering**

**Goal:**  
Hide Sequencer-only panels while in *Digital Twin* or any non-sequencer mode.

**Rule:**  
Right rail should render scene-specific content only.  
For the *Digital Twin* scene:  
- Show **Option Menu**, **ALE Context status**, or other Digital-only controls.  
- ❌ **Do not render** `GraphSequencerPanel` or any Sequencer data controls.  

**Implementation Detail:**
```tsx
<SceneTemplate
  leftRail={<DigitalRail />}
  rightRail={
    scene === "sequencer"
      ? <SequencerRightRail />    // Timeline, ROI summary, etc.
      : <DigitalRightRail />      // Option Menu, ALE Context
  }
>
  <SceneContent />
</SceneTemplate>
```

---

### **3. Graph Legacy Cleanup**

Before re-enabling Sequencer:
- Remove or comment out all legacy **GraphCanvasWrapper** or `bg-[#10101c]` elements.
- Replace with unified white theme block from `SceneTemplate`.

**Example Fix:**
```tsx
<div className="rounded-2xl border border-slate-200 bg-white p-4">
  <GraphCanvas {...props} />
</div>
```

---

### **4. Behavioral Note — Hide Sequencer Panels**

In `ExperienceClient.tsx`:
```tsx
if (scene === "digital") {
  // Digital scene → use DigitalRightRail only
  rightRail = <DigitalRightRail />;
}
if (scene === "sequencer") {
  rightRail = <SequencerRightRail />;
}
```

✅ **Outcome:**  
- No ghost Sequencer panels in Digital Twin.  
- Clean theme across both rails.  
- Left nav taxonomy and role context consistent app-wide.

---

> Once implemented, this ensures Digital Twin and Sequencer share the same parent structure but remain visually and functionally distinct.  
> Sequencer panels only appear in Sequencer mode; Digital scene stays clean and aligned with the unified white theme.

