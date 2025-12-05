## D066B — UXShell Alignment Hotfix
**Version:** v0.6.12-hotfix  
**Owner:** Codex (UI Layout Maintainer)  
**Status:** Active  
**Supersedes:** D060, D066A layout portions  

### Purpose
Restore GPT-style UXShell behavior and lock the left navigation lane at a fixed width. Prevent flex/grid drift that causes the sidebar to stretch horizontally or overlap content.

---

### Implementation

#### File  
`/src/components/UXShellLayout.tsx`
```tsx
export default function UXShellLayout({ children }) {
  return (
    <div className="uxshell-layout">
      <aside className="uxshell-sidebar">
        <Sidebar />
      </aside>
      <main className="uxshell-content">{children}</main>
    </div>
  );
}
```

#### Styles (Tailwind)
```tsx
/* /src/styles/uxshell.css */
.uxshell-layout {
  @apply grid h-screen overflow-hidden;
  grid-template-columns: 280px 1fr;
}

.uxshell-sidebar {
  @apply border-r border-black/5 overflow-y-auto p-3;
  max-width: 280px;
  flex-shrink: 0;
  background-color: var(--sidebar-bg, #fafafa);
}

.uxshell-content {
  @apply overflow-y-auto p-6;
  background-color: var(--content-bg, #ffffff);
  min-width: 0;
  flex-grow: 1;
}

/* Responsive Alignment Addendum */
@media (max-width: 1439px) {
  .uxshell-layout {
    grid-template-columns: 260px 1fr;
    gap: 16px;
  }
  .uxshell-content {
    padding: 20px;
  }
}

@media (max-width: 1023px) {
  .uxshell-layout {
    grid-template-columns: 240px 1fr;
    gap: 12px;
  }
  .uxshell-content {
    padding: 16px;
  }
}
```

#### Telemetry
Emit:
```js
uxshell_layout_violation = {
  width: sidebarWidth,
  maxAllowed: 320,
  timestamp: new Date().toISOString()
};
```
if sidebar exceeds 320 px at render.

---

### Enforcement Notes
1. No component may override layout grid (`flex`, `w-full`, etc.).
2. Sidebar width locked at 280 px (± 40 px tolerance for responsive).
3. All content renders within `.uxshell-content`; no absolute positioning allowed outside layout grid.
4. Add `UX_SHELL_LOCK = true` flag in configuration.

---

### Responsive Alignment Addendum

| Breakpoint | Sidebar Width | Gutter | Content Padding | Net Visual Gap | Notes |
|-------------|----------------|---------|------------------|----------------|-------|
| `≥ 1440px` | 280 px | 24 px | 24 px | ~48 px | keep full spacing |
| `1024–1439px` | 260 px | 16 px | 20 px | ~32 px | *target sweet spot* ✅ |
| `< 1024px` | 240 px | 12 px | 16 px | ~24 px | compact but breathable |

Ensures balance and comfort on all screens, maintaining visual discipline while tightening horizontal flow.

---

### Expected Result
- Sidebar fixed at 280 px on large, 260/240 px on smaller viewports.  
- Command Deck and Insights expand to full width.  
- Vertical rhythm and scroll isolation restored.  
- GPT-like calm, balanced viewport.

---

## Fuxi UX Commandments (Genesis Draft)

> **Commandment I**  
> “Thou shalt not allow the Sidebar to consume the Screen.”  
> — *Fuxi, v0.6.12*

> **Commandment II**  
> “Thou shalt preserve whitespace, for clarity dwelleth therein.”

> **Commandment III**  
> “Thou shalt build thy UXShell upon a grid, not chaos.”

