### Directive D041 Addendum B — Adopt SBGN as Primary Layout Engine

#### 🌟 Objective  
Replace the current force/Dagre layout with **SBGN-style orthogonal layout** as the default for Digital Enterprise visualization.  
Goal: scalable, deterministic, and presentation-ready graph clarity for up to 1k nodes / 2k edges.

---

#### 🧠 Rationale  
- Force and Dagre layouts break down visually under node density.  
- SBGN provides deterministic positioning with clear left-to-right dependency flow.  
- Aligns with how architects communicate transformation: **data → core → channels → experience**.  
- Supports version-to-version diffing and repeatable visuals for roadmap tracking.

---

#### 🧹 Implementation  
```js
cy.layout({
  name: 'cola',
  flow: { axis: 'x', minSeparation: 180 },
  nodeSpacing: 60,
  avoidOverlap: true,
  animate: false,
  fit: true,
});
```

##### Node & Edge Styling  
| Element | Description | Style |
|----------|--------------|-------|
| **Node** | System/Application | `#f8fafc` bg, domain-colored border |
| **Edge** | Dependency | right-angle routing, `#94a3b8` solid |
| **Domain Box** | Functional grouping | `rgba(100,116,139,0.05)` background |
| **Added/Removed** | Change state | Green/Red halo |
| **Confidence** | Fill opacity by confidence |

##### Domain Lanes  
Left-to-right order:  
**Data → Core / ERP / MDM → Commerce / CRM / OMS → Experience / Analytics**

---

#### 🔧 Telemetry Extension  
```json
{
  "event": "graph_render",
  "layout": "sbgn",
  "nodes": 122,
  "edges": 279,
  "avg_confidence": 0.68
}
```

---

#### 🧭 Future Enhancements  
- Auto-cluster high-degree nodes (e.g., Commerce Engine).  
- “Explore mode” re-enables force layout for local focus.  
- Persist node positions to `.fuxi/data/layout_cache.json`.

---

#### ✅ Expected Outcome  
- High-readability, reproducible DE graphs at enterprise scale.  
- Simplified storytelling for modernization and sequencing scenarios.  
- Stable baseline for later animation and AI-assisted topology generation.

