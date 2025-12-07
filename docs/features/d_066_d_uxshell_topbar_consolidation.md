### Directive D066D – UXShell Topbar Consolidation (Fixed Global Position)

**Objective**\
Establish the new global navigation bar (dark GPT-like header) as the sole, fixed navigation element anchored to the top of the viewport. Eliminate redundant or nested navigation components that previously appeared in child layouts.

---

#### 1. Purpose

Create a unified, professional, always-visible global navigation bar that provides consistent access to primary routes and aligns with the anticipatory agent behavior (D075). This ensures users experience a cohesive, stable navigation layer that does not shift, duplicate, or reset between routes.

---

#### 2. Expected Behavior

- The topbar remains **fixed at ****top: 0** of the window.
- It is **always visible**, even when scrolling content.
- Content below (`.uxshell-content`) adjusts automatically with a top padding equal to the header height.
- **No other layout** (UnifiedLayout, child routes) renders an additional nav.
- **Agent Integration:** anticipatory guidance can highlight, pulse, or animate icons contextually.

---

#### 3. Implementation Details

**Component Hierarchy:**

```jsx
<body>
  <UXShellLayout>
    <UXShellTopbar />   // fixed, global
    <main className="uxshell-content">
      <Sidebar />
      <Outlet />        // dynamic route content (Onboarding, ROI, Sequencer, etc.)
    </main>
  </UXShellLayout>
</body>
```

**Files to Modify:**

- `src/components/UXShellLayout.tsx`  → mounts `<UXShellTopbar />`.
- `src/components/UnifiedLayout.tsx`  → remove any `<NavIcons>` or duplicate toolbars.
- `src/styles/uxshell.css`  → add grid and topbar styles.

**CSS Spec:**

```css
.uxshell-layout {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100vh;
}

.uxshell-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: #1C1C1E;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}

.uxshell-content {
  padding-top: 56px; /* offset global nav height */
  overflow: auto;
}
```

---

#### 4. Design Principles

| Principle             | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| **One Global Nav**    | The dark GPT-style topbar is the single navigation source.          |
| **Fixed Position**    | It never scrolls or disappears.                                     |
| **Stable Hierarchy**  | Sidebar and content align visually beneath it.                      |
| **Agent Orientation** | The anticipatory agent references this nav for contextual guidance. |

---

#### 5. Integration with D075 (Anticipatory Interaction)

- The topbar acts as a **visual compass** for the agent.
- When the agent suggests a new view (e.g., *"Let's open Sequencing"*), the corresponding icon pulses briefly before routing.
- Topbar is the anchor point for preview modals and contextual insights.

---

**Success Criteria:**

- ✅ Only one global nav renders.
- ✅ Nav remains visible at all times.
- ✅ No layout stacking or scroll offset issues.
- ✅ Agent and UI transitions reference consistent spatial anchors.

