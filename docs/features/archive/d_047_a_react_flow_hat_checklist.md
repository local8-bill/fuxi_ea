# HAT Validation Sheet — D047A React Flow Integration

**Objective:** Validate React Flow implementation in `/digital-enterprise` and `/ecosystem` views before merge to `dev`.

---

## 1. Environment Setup

**Step 1:** Confirm local environment variables
```
NEXT_PUBLIC_GRAPH_ENGINE=reactflow
NEXT_PUBLIC_TELEMETRY_DEBUG=true
```

**Step 2:** Rebuild & launch project
```
npm run dev
```

**Expected Result:** Local server starts without build errors. React Flow package loaded (check console for `@xyflow/react` initialization).

---

## 2. Functional Tests

| Test Case | Action | Expected Result | Pass/Fail |
|------------|--------|----------------|------------|
| **1. Graph Load** | Navigate to `/project/700am/digital-enterprise` | Graph loads within 2s; all nodes and edges visible |  |
| **2. Zoom/Pan** | Use mouse/trackpad zoom and drag | Smooth zoom/pan; no layout shift or flicker |  |
| **3. Fit-to-View** | Trigger fit view (Ctrl+0 or button) | Graph recenters correctly |  |
| **4. MiniMap Visibility** | Verify minimap appears bottom-right | Shows correct domain distribution |  |
| **5. Edge Rendering** | Hover on edges | Highlighted; smooth bezier curve |  |
| **6. Node Labels** | Check for truncated text | Full readable label per node |  |
| **7. Telemetry Logging** | Open console and switch timeline slider | `timeline_stage_changed` event logs correctly |  |
| **8. Graph Load Telemetry** | Refresh page | `graph_load` event fires with node/edge counts |  |
| **9. Switch Mode (Cytoscape)** | Change `.env` → `NEXT_PUBLIC_GRAPH_ENGINE=cyto` and restart | Graph loads in Cytoscape mode |  |
| **10. Cross-Validation** | Compare React Flow vs Cytoscape | Same number of nodes/edges in both |  |

---

## 3. Visual Verification

| Element | Validation Point | Pass/Fail |
|----------|------------------|------------|
| **Node Colors** | Added (Green), Modified (Yellow), Removed (Red), Unchanged (Gray) |  |
| **Edge Colors** | Derived (Blue), Inferred (Violet), Unresolved (Orange) |  |
| **Domain Labels** | Correctly positioned and non-overlapping |  |
| **Responsiveness** | Graph resizes gracefully between 800–2560px |  |
| **Theme** | `xy-theme.css` applied (check button/handle colors) |  |

---

## 4. Performance & Stability

| Test Case | Expected Result | Pass/Fail |
|------------|----------------|------------|
| **Load Time** | <2 seconds (56-node dataset) |  |
| **FPS Stability** | >55 FPS while panning |  |
| **Memory Usage** | <200 MB browser memory footprint |  |
| **No Crashes** | Console shows no `useReactFlow` or state errors |  |

---

## 5. Rollback & Sign-off

**Rollback Steps:**
- Set `.env.local` → `NEXT_PUBLIC_GRAPH_ENGINE=cyto`
- Restart `npm run dev`
- Confirm Cytoscape graph loads successfully.

**Sign-off Checklist:**
- [ ] Graph rendering validated
- [ ] Telemetry verified
- [ ] Environment toggle functional
- [ ] No regressions in `/ecosystem` view

**Approvers:**
- Fuxi (UAT Oversight)
- Codex (Implementation)
- Bill (Final HAT Sign-off)

---

**Target Tag for Completion:** `v0.6.6-reactflow-baseline`

