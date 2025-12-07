## 🧭 Directive D069A + D066E + D069L — Unified Experience Shell Finalization + Legacy UX Deprecation

### **Objective**
Finalize the unified Fuxi Experience Shell for demo readiness, and permanently deprecate all pre-agent UX routes, components, and layouts.

---

### ⚠️ **DEPRECATION NOTICE**
The following components, routes, and layouts are now **permanently deprecated**: They must **not** be referenced, imported, or merged into any new UXShell or Agent Experience code.

| Path | Status | Replacement |
|------|---------|-------------|
| `/project/[id]/onboarding/page.tsx` | ❌ Deprecated | `/project/[id]/experience` (scene: onboarding) |
| `/project/[id]/roi-dashboard/page.tsx` | ❌ Deprecated | `/project/[id]/experience` (scene: roi) |
| `/project/[id]/harmonization-review/page.tsx` | ❌ Deprecated | `/project/[id]/experience` (scene: harmonization) |
| `/project/[id]/digital-enterprise/page.tsx` | ❌ Deprecated | `/project/[id]/experience` (scene: review) |
| `/components/UnifiedLayout.tsx` | ❌ Deprecated | `UXShellLayout.tsx` |
| `/components/LegacyTopbar.tsx` | ❌ Deprecated | `UXShellTopbar.tsx` |
| `/components/ChatPane.tsx` | ❌ Deprecated | `AgentExperience.tsx` |

> 🧭 **Enforcement Rule**  
> If any file listed above is referenced or imported, **delete or quarantine** it under `/src/deprecated/`.  
> Legacy files must not be reintroduced through merges or imports.

---

### 🧩 **Implementation Requirements**

#### 1. Canonical Route
All experiences consolidate under:
```
/project/[id]/experience
```

#### 2. Experience Flow
```tsx
const { scene, setScene } = useAgentFlow();
switch (scene) {
  case "onboarding": return <OnboardingScene />;
  case "harmonization": return <HarmonizationScene />;
  case "roi": return <RoiScene />;
  case "review": return <ReviewScene />;
  default: return <CommandDeck />;
}
```

#### 3. Topbar Alignment (D066E Integration)
- 56px fixed header as part of root grid  
- Sidebar: 240px  
- Insights: 320px  
- No `position: fixed` or `padding-top` in `.uxshell-topbar` or `.uxshell-content`

#### 4. Telemetry
Emit unified transition events:
```json
{
  "event": "agent_flow_transition",
  "from": "onboarding",
  "to": "roi",
  "confidence": 0.94
}
```

---

### 🧰 **Repository Actions**

#### a. Deprecate Legacy Files
Move legacy directories:
```bash
mkdir src/deprecated
git mv src/app/project/[id]/onboarding src/deprecated/onboarding
git mv src/app/project/[id]/roi-dashboard src/deprecated/roi-dashboard
git mv src/app/project/[id]/harmonization-review src/deprecated/harmonization-review
```

#### b. Protect from Merge
```bash
git update-index --skip-worktree src/deprecated/**
```

#### c. Add Regression Test
`tests/uxshell_no_legacy_imports.spec.ts`
```js
test('No legacy imports exist in UXShell', async () => {
  const files = await globby('src/**/*.tsx');
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    expect(text).not.toMatch(/UnifiedLayout|LegacyTopbar|ChatPane/);
  }
});
```

---

### ✅ **Success Criteria**
| Goal | Definition of Done |
|------|--------------------|
| **Unified Route Active** | All `/project/[id]/*` routes redirect to `/experience` |
| **No Topbar Misalignment** | Header sits flush, no scroll jumps |
| **No Legacy Imports** | CI test passes |
| **Agent Controls Flow** | Scenes switch via agent intent |
| **Demo-Ready** | Only `/experience` route visible to end user |

