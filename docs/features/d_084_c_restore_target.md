# 🧩 Directive D084C_Restore_Target
### Title: **Restore Full OMS Transformation Graph (FY26–FY28)**

**Branch:** `feature/d084c_oms_transformation_graph`  
**Owner:** dx  
**Approvers:** Agent Z · EAgent · Fuxi Core  

---

## 🌟 Objective
Reinstate the **Enterprise OMS Transformation Graph** (Iteration 1) — the version shown in the reference capture, with FY26–FY28 timelines, Sequencer, Node Inspector, ALE reasoning, and EAgent overlays fully operational.

---

## ⚙️ Restoration Steps

### **1. Confirm Baseline**
Ensure current prototype is at **Visual Grammar** baseline (`D082B`).
```bash
git checkout feature/d084c_oms_transformation_graph
git reset --hard d082b_visual_grammar_stable
```

---

### **2. Restore Graph Data Source**
Rebind graph loader to the OMS dataset:
```
src/data/graph/oms_transformation.json
```
This file must contain OMS, MFCS, and EBS nodes + integration links.

**Example Node:**
```json
{
  "id": "oms_core",
  "domain": "Order Management",
  "phase": "FY26",
  "reasoning": ["foundational_system_coupling"]
}
```

---

### **3. Reinstate Functional Modules**

#### 🧱 **Timeline & Sequencer**
- Timeline band: `FY26`, `FY27`, `FY28`
- Sequencer cards:
  1. Deploy Unified OMS – FY26 (Cost $4.5M, Impact 70%)
  2. MFCS Modernization – FY27 (Cost $3.1M, Impact 60%)
  3. EBS Accounting Sunset – FY28 (Cost $2.2M, Impact 50%)

**Component Path:** `src/components/SequencerPanel.tsx`
```ts
<Sequencer simulate={true} />
```

---

#### 💡 **EAgent Overlay**
Re-enable dynamic context narration:
> “Highlighting key OMS, MFCS, and EBS domains. Focusing on FY28.”

**Component:** `EAgentOverlay.tsx`

---

#### 🧠 **Node Inspector**
Re-enable ALE context and risk feedback:
- ALE Context → `foundational_system_coupling`
- Risk Level → `High` (highlight red)
- Add `Recent Insights` and `Learning Console` below

**Event Hook:**
```ts
onSelectNode(node => ALEContext.set(node.reasoning))
```

---

#### 🟙️ **Store Overlay**
Load store metadata from Ronald’s dataset:
```
/data/store_location_updated.csv
```
Display aggregated counts by region:
- NA: 162 stores  
- EMEA: 108 stores  
- APAC: 91 stores  

**Component:** `StoreOverlay.tsx`

---

### **4. Validate Live Interactivity**
| Test | Expected Behavior |
|------|--------------------|
| Select node (e.g. Oracle EBS) | ALE updates reasoning context |
| Risk label | Turns red with “High” |
| Learning console | Logs LE events (e.g., LE-002, LE-005) |
| Sequencer | Phases reorder interactively |
| EAgent overlay | Updates context based on FY stage |
| Store overlay toggle | Adds/removes region data correctly |

---

### **5. Commit and Push**
```bash
git add .
git commit -m "Restore D084C OMS Transformation Graph (FY26–FY28 timeline + ALE context)"
git push origin feature/d084c_oms_transformation_graph
```

---

## ✅ Verification Summary
| Module | Working State |
|---------|----------------|
| Timeline Bands | FY26–FY28 visible |
| Sequencer | Phasing cards interactive |
| EAgent Overlay | Context narration active |
| Node Inspector | ALE context & risk live |
| Learning Console | Logs reasoning events |
| Store Overlay | Displays store data |
| Data Source | Reads OMS JSON correctly |

---

**Note from Z:**  
> This build is our proof-of-life for the OMS modernization intelligence layer. Preserve all ALE hooks and EAgent callouts — Dynamic Sequencing (D085A) depends on this exact structure.

---

**Deliverable:**  
Reinstated `/dev/graph-oms` visualization, fully live with reasoning, sequencing, and overlays.  
**Outcome:** Return to reference state from *Dec 9, 2025 (8:53 PM capture)* — operational across all modules.

