## ⚡️ Directive D080D – Tips Activation Patch

### 🎯 Purpose
Re-enable the **EAgent Tips / Onboarding flow** inside the Experience Shell so users can access guided introductions and context hints at any time — without resetting localStorage.

---

### 🧩 Scope
Applies to:
- `src/components/experience/ExperienceShell.tsx`
- `src/components/agent/TipsOverlay.tsx` (existing or to be created)
- `src/hooks/useTips.ts` (optional helper hook)

---

### 🧱 Implementation Requirements

#### 1. Mount the Tips overlay inside Experience Shell
Insert just before the closing `</main>` tag in `ExperienceShell.tsx`:

```tsx
import { TipsOverlay } from "../agent/TipsOverlay";
import { useState, useEffect } from "react";

export const ExperienceShell = () => {
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    // Auto-trigger for first-time users
    if (!localStorage.getItem("fuxi_user_profile")) {
      setShowTips(true);
    }
    // Dev override
    if (window.__FUXI_DEBUG_TIPS) {
      setShowTips(true);
    }
  }, []);

  return (
    <>
      {/* existing Experience Shell layout */}
      {showTips && <TipsOverlay onClose={() => setShowTips(false)} />}
    </>
  );
};
```

---

#### 2. Optional EAgent command trigger  
Enable a typed `/tips` or `/showtips` command handled in the EAgent message router:

```ts
if (input.trim() === "/tips") {
  telemetry("tips_triggered", { source: "manual_command" });
  setShowTips(true);
  return;
}
```

---

#### 3. Add a persistent “💡 Tips” icon (optional)
In `UXShellTopbar.tsx`, append:
```tsx
<Button variant="ghost" onClick={() => setShowTips(true)}>💡 Tips</Button>
```
This gives users a visible, non-command way to open the onboarding overlay.

---

### 🧠 Telemetry
Emit:
- `tips_shown`
- `tips_closed`
- `tips_triggered_manual`
- `tips_triggered_auto`

to `/lib/telemetry/onboarding.ts`.

---

### 🧪 Testing / Verification
| Scenario | Expected Result |
|-----------|----------------|
| New user (no profile) | TipsOverlay auto-appears |
| `/tips` typed in EAgent | Overlay toggles open |
| “Tips” icon clicked | Overlay opens, can close |
| Returning user | No auto trigger |
| `window.__FUXI_DEBUG_TIPS = true` | Forces overlay for debug/demo |

---

### ✅ Deliverable
- Branch: `feature/d080d_tips_activation_patch`
- PR Target: `dev`
- Label: `enhancement`, `UXShell`, `EAgent`
- Reviewers: Fuxi & Agent Z

