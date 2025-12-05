## D066C — UXShell Interaction + Playwright Spec

### Purpose
Define and enforce the **canonical click behaviors** of the UXShell left navigation through both implementation rules and automated Playwright tests.

---

### 1. Global Interaction Rules
| Rule | Description |
|------|--------------|
| **Single-click toggle** | Clicking a section header (`▾` / `▸`) expands or collapses that section. |
| **Click on item text** | Loads that item’s view **in the main content panel**, preserving sidebar state. |
| **Only one expanded section per group type** | Projects, Views, or Modes can have only one active expanded state. |
| **Active item highlight** | Left border (2px primary color) + semibold text. |
| **Telemetry** | Emit `uxshell_click`, `uxshell_expand`, `uxshell_collapse`, `uxshell_load_view`. |

---

### 2. Project Section Behavior
```
▾ PROJECTS
   700am — Core
   951pm — Pilot
   Demo Workspace
   + New Project
```

| Element | Action |
|----------|---------|
| `▾ PROJECTS` | Toggle expand/collapse list. |
| `700am — Core` | Loads `/project/{id}/dashboard`. |
| `+ New Project` | Opens inline modal `/project/new`. |

---

### 3. Views Section Behavior
```
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
```

| Element | Action |
|----------|---------|
| `▾ VIEWS` | Toggle expand/collapse views list. |
| `▾ Σ ROI` | Toggle ROI sub-list. |
| `ROI 1/2/3` | Loads `/project/{id}/roi/{roiId}`. |
| `+ New ROI` | Opens modal to create new ROI. |
| `▸ + Graph` | Loads `/project/{id}/digital-enterprise`. |
| `▸ ⇄ Sequencer` | Loads `/project/{id}/sequencer`. |
| `▸ ✓ Review` | Loads `/project/{id}/review`. |
| `▸ ∞ Digital Enterprise` | Loads `/project/{id}/digital-enterprise`. |

---

### 4. Modes Section Behavior
```
▾ MODES
   Architect
   Analyst
   CFO
   FP&A
   CIO
```

| Element | Action |
|----------|---------|
| `▾ MODES` | Toggle expand/collapse mode list. |
| Mode name | Switches workspace context, emits `uxshell_mode_changed`. |
| Highlight | Active mode uses hover glow + filled selection pill. |

---

### 5. Edge and Visual Behavior
| Behavior | Description |
|-----------|-------------|
| Collapsing a parent auto-collapses children. |
| Smooth rotation on `▾` (200ms CSS transition). |
| Re-clicking active item scrolls to top, not reload. |
| Sidebar width locked to 280→260 px responsive. |

---

### 6. Playwright UI Tests

**File:** `/tests/ui/uxshell-sidebar.spec.ts`
```ts
test.describe('UXShell Sidebar Behavior', () => {
  test('expands and collapses sections correctly', async ({ page }) => {
    await page.click('text=VIEWS');
    await expect(page.locator('text=Σ ROI')).toBeVisible();
    await page.click('text=VIEWS');
    await expect(page.locator('text=Σ ROI')).toBeHidden();
  });

  test('loads correct content on click', async ({ page }) => {
    await page.click('text=ROI 1 (Hypothesis)');
    await expect(page).toHaveURL(/roi/);
    await page.waitForSelector('#roi-dashboard');
  });

  test('mode change emits telemetry', async ({ page }) => {
    const [telemetry] = await Promise.all([
      page.waitForResponse(/telemetry/),
      page.click('text=Analyst')
    ]);
    expect(await telemetry.json()).toContain('uxshell_mode_changed');
  });

  test('sidebar width stable', async ({ page }) => {
    const width = await page.$eval('.uxshell-sidebar', el => el.offsetWidth);
    expect(width).toBeLessThanOrEqual(320);
  });
});
```

---

### 7. Validation Checklist
- [ ] All expand/collapse icons functional
- [ ] Telemetry fires for all interactions
- [ ] Sidebar width ≤ 320 px
- [ ] Content renders in-place (no full reload)
- [ ] Only one expanded section per group

---

**Status:** Ready for implementation  
**Assigned To:** Codex / UI-QA  
**Version:** v0.6.12-UAT  
**Dependencies:** D066A–B

