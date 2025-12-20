## **D089K — Digital Twin Production Refinement Bundle**

---

### **R1 — Graph Dynamic Height Refinement**

#### 🧭 Objective  
Ensure the Digital Twin and all future SceneTemplate children dynamically scale graph height to fit the viewport, independent of rail configuration or theme.

#### 🧩 Implementation Steps

1. **Stage Container Adjustment**
   ```tsx
   <div className="flex-1 h-[calc(100vh-220px)] overflow-hidden">
     {children}
   </div>
   ```

2. **GraphCanvas Wrapper**
   ```tsx
   <div className="h-full">
     <GraphCanvas height="100%" ... />
   </div>
   ```

3. **Rail Responsiveness**
   - Rails remain fixed width (280 px expanded / 48 px collapsed).
   - Stage automatically calculates remaining space dynamically.

4. **Outcome**
   - Graph fills the viewport without hardcoded values.
   - Vertical alignment is consistent across scenes.

---

### **R2 — Graph Responsiveness & Viewport Awareness**

#### 🧭 Objective  
Make GraphCanvas dynamically adjust its grid layout and zoom based on available viewport width and rail state.

#### 🧩 Implementation Steps

1. **Observe Rail State + Stage Width**
   ```tsx
   const { leftCollapsed, rightCollapsed } = useRailState();
   const [stageWidth, setStageWidth] = useState<number>(0);
   const stageRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
     const resizeObserver = new ResizeObserver(entries => {
       for (const entry of entries) setStageWidth(entry.contentRect.width);
     });
     if (stageRef.current) resizeObserver.observe(stageRef.current);
     return () => resizeObserver.disconnect();
   }, []);
   ```

2. **Responsive Grid Columns**
   ```tsx
   let domainColumns = 3;
   if (stageWidth > 1800) domainColumns = 5;
   else if (stageWidth > 1400) domainColumns = 4;
   else if (stageWidth < 1000) domainColumns = 2;
   else if (stageWidth < 700) domainColumns = 1;
   ```

3. **Auto-Center and Initial Fit**
   ```tsx
   useEffect(() => {
     if (graphInstance && livingMapData.nodes.length > 0) {
       graphInstance.fitView({ padding: 0.1, duration: 500 });
     }
   }, [graphInstance, domainColumns]);
   ```

4. **Zoom Thresholds**
   ```tsx
   const zoom = graphInstance.getZoom();
   if (zoom < 0.75) graphInstance.zoomTo(0.75, { duration: 300 });
   ```

#### ✅ Verification Checklist
- Graph expands when rails collapse.
- Always centered and legible.
- Resizes dynamically on viewport change.

---

### **R3 — Node Grammar & Visual Hierarchy Cleanup**

#### 🧭 Objective  
Refine **GraphNode** rendering to establish a consistent, legible, and semantically correct visual grammar for domains, systems, and integrations.

#### 🧩 Implementation Details

1. **Domain Box Layout**
   - Add top padding to prevent sub-node overlap:
     ```css
     .graph-domain-inner { padding-top: 32px; }
     ```
   - Position “Flows” label in header area: `position: absolute; top: 12px;`

2. **Remove Redundant Domain Names**
   - Domain node header → domain name
   - Sub-node → system name + integration count

3. **Reintroduce Integration Metrics**
   ```text
   Integrations • 12   |   ROI +5.3%   |   TCC ↓2.1%
   ```
   - Fallback to “Integrations • N” when metrics unavailable.

4. **Define Color Scheme**
   | Element | Token | Notes |
   |----------|--------|--------|
   | Domain Border | `border-emerald-300` | Harmonized grouping |
   | Domain Background | `bg-emerald-50` | Light tint |
   | System Border | `border-slate-200` | Neutral |
   | System Background | `bg-white` | Base |
   | Integration Edges | `stroke-emerald-400/50` | Subtle lines |
   | Text Primary | `text-slate-900` | Labels |
   | Text Secondary | `text-slate-500` | Metrics |

5. **Node Shadow + Hover States**
   ```css
   .graph-system { box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
   .graph-system:hover { border-color: #059669; background-color: #ECFDF5; }
   ```

6. **Hover/Focus Linking**
   - Highlight connected nodes + edges when a node is hovered or selected.

#### ✅ Verification Checklist
- Domain headers and system clusters no longer overlap.
- Duplicate domain labels removed.
- Integration counts and metrics visible.
- Consistent color hierarchy (domain > system > edge).
- Final graph feels clean, legible, and production-ready.

---

### **🎯 Combined Outcome**

After R1–R3:
- Graph fits dynamically in any viewport.
- Layout adapts intelligently to rail collapse and window resize.
- Nodes follow unified visual grammar and color rules.
- The Digital Twin scene is visually consistent with Sequencer, thematically unified, and ready for production rollout.

