## 🔒 Directive Addendum — Sidebar Lockdown (D060A Compliance Enforcement)

### **Directive ID:** D060A-L1  
### **Scope:** `src/components/layout/Sidebar.tsx`  
### **Owner:** Bill Maynard  
### **Effective Immediately**

---

### **Purpose**
To **finalize and freeze** the canonical sidebar structure for the Fuxi Unified Experience Shell.  
This directive supersedes any prior experimental or interim sidebar logic and establishes the **final, demo-approved navigation hierarchy**.

---

### **Authority**
**Codex and all automated agents** are prohibited from making any structural, stylistic, or behavioral modifications to the Sidebar component without **explicit written approval** from Bill Maynard.  
Any merge, push, or commit that alters this layout **must be reviewed and approved** under Directive D060A-L1 governance.

---

### **Approved Sidebar Structure (Immutable)**

```
▾ PROJECTS
   700am — Core
   951pm — Pilot
   Demo Workspace
   + New Project

▾ VIEWS
   ▾ Σ ROI
      ROI 1 (Hypothesis)
      ROI 2 (Actuals)
      ROI 3 (Scenario B)
      + New ROI

   ▸ + Graph
   ▸ ⇄ Sequencer
   ▸ ✓ Review
   ▸ ∞ Digital Enterprise

▾ MODES
   Architect
   Analyst
   CFO
   FP&A
   CIO
```

---

### **Implementation Constraints**

| Element | Spec |
|----------|------|
| **Width** | Fixed at 240px |
| **Theme** | Light / neutral (white background, slate typography) |
| **Hierarchy** | 3 top-level sections: Projects, Views, Modes |
| **Behavior** | Expand/collapse with ▾ / ▸ indicators |
| **Typography** | Uppercase section headers; 13px nav items |
| **Spacing** | 12px line rhythm, 24px between sections |
| **Telemetry** | `nav_section_toggled`, `nav_item_selected`, `nav_mode_selected` |
| **Persistence** | Expand/collapse state stored via `localStorage` |
| **Alignment** | Anchored under global topbar (D066D) |
| **Animation** | Smooth ease-in-out 150ms transitions |

---

### **Code Freeze Notice**
The following file is **frozen under Directive D060A-L1**:
```
src/components/layout/Sidebar.tsx
```

**Modification rights:**  
Only Bill Maynard may authorize edits to this component or its submodules.

---

### **Success Criteria**
- ✅ Sidebar renders exactly as in approved preview (2025-12-06 build).  
- ✅ No “LIVE / DRAFT / DEMO” badges present.  
- ✅ Correct expand/collapse behavior verified in telemetry logs.  
- ✅ Width fixed at 240px across all breakpoints.  
- ✅ Layout aligns with topbar grid.

