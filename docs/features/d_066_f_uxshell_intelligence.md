### 🧭 Directive D066F – UXShell Canonical Extension: Intelligence Branch

#### **Objective**
Extend the canonical UXShell sidebar structure to include an *Intelligence* branch for behavioral telemetry visualization and user transparency.  

This aligns Fuxi’s UX with its emerging behavioral intelligence system — enabling users and internal teams to explore *Activity*, *Engagement*, and *Actions* as live analytics views.

---

### 📐 **Updated Canonical Sidebar Structure**

```
▾ PROJECTS
   [activeProject]
   + New Project

▾ VIEWS
   Σ ROI
   ⇄ Sequencer
   ∞ Digital Twin
   ✓ Review

▾ MODES
   Architect
   Analyst
   CFO
   FP&A
   CIO

▾ INTELLIGENCE
   User Activity
   User Engagement
   User Actions
```

---

### 🧩 **Behavioral Semantics**

| Node | Description | Metrics Derived |
|------|--------------|----------------|
| **User Activity** | Tracks motion, navigation, and dwell time patterns | scene_viewed, nav_section_toggled, view_time_by_scene |
| **User Engagement** | Reflects depth of cognitive and emotional involvement | agent_message_sent/received, AI Trust Index, Goal Articulation Score |
| **User Actions** | Represents transformation decisions and behavioral outcomes | decision_taken, pulse_state_change, Change Appetite Level |

---

### ⚙️ **Implementation Notes**

**File:** `src/components/layout/Sidebar.tsx`

```tsx
const sidebarSections = [
  {
    label: "Intelligence",
    key: "intelligence",
    items: [
      { label: "User Activity", href: "/intelligence/activity" },
      { label: "User Engagement", href: "/intelligence/engagement" },
      { label: "User Actions", href: "/intelligence/actions" },
    ],
  },
];
```

**Telemetry Additions (lib/telemetry/navigation.ts):**

```ts
logEvent("nav_section_toggled", { section: "intelligence" });
logEvent("nav_item_selected", { item: "user_activity" });
```

**Routes:**

| Path | Component | Description |
|------|------------|-------------|
| `/intelligence/activity` | `IntelligenceActivity.tsx` | Displays navigation, dwell, and flow metrics. |
| `/intelligence/engagement` | `IntelligenceEngagement.tsx` | Displays conversational depth and trust analytics. |
| `/intelligence/actions` | `IntelligenceActions.tsx` | Displays transformation actions and ROI decisions. |

---

### 🎨 **UX + Research Context**

| Dimension | Intent |
|------------|--------|
| **Cognitive Transparency** | Show users what Fuxi learns about them. |
| **Self-Awareness Loop** | Encourage reflection and mastery through metrics. |
| **Adaptive Intelligence Feed** | Feeds data back into EAgent for adaptive behavior. |
| **Ethical Insight Design** | Keeps telemetry visualized and interpretable. |

