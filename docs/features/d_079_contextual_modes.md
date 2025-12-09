### Supplemental Implementation for D079 – Contextual Mode Switching Framework

#### 1️⃣ modes.json (Configuration File)
```json
{
  "founder": {
    "permissions": ["directives.edit", "codex.execute", "telemetry.view"],
    "tone": "analytical",
    "visibleUI": ["directivePanel", "systemTelemetry", "agentConsole"],
    "skills": ["system_introspection", "directive_analysis"],
    "description": "System and architecture control with full visibility."
  },
  "user": {
    "permissions": ["project.interact", "upload.artifacts", "chat.eagent"],
    "tone": "conversational",
    "visibleUI": ["commandDeck", "digitalTwin", "roiPanel"],
    "skills": ["user_guidance", "contextual_navigation"],
    "description": "Standard product UX with EAgent guidance."
  },
  "demo": {
    "permissions": ["readonly.view", "telemetry.showcase"],
    "tone": "energetic",
    "visibleUI": ["commandDeck", "digitalTwin", "roiPanel", "showcaseBanner"],
    "skills": ["presentation_overlay"],
    "description": "Live demo presentation overlay for public view."
  },
  "research": {
    "permissions": ["analytics.view", "ux.telemetry"],
    "tone": "reflective",
    "visibleUI": ["insightsDashboard", "telemetryConsole"],
    "skills": ["data_visualization", "metric_analysis"],
    "description": "Data and UX insights analysis."
  },
  "test": {
    "permissions": ["qa.run", "telemetry.log"],
    "tone": "neutral",
    "visibleUI": ["testPanel", "telemetryConsole"],
    "skills": ["automation_control"],
    "description": "QA validation mode for automated test suites."
  },
  "support": {
    "permissions": ["system.logs", "incident.manage"],
    "tone": "calm",
    "visibleUI": ["telemetryConsole", "recoveryTools"],
    "skills": ["diagnostic_analysis", "error_recovery"],
    "description": "System maintenance and support diagnostics."
  },
  "architect": {
    "permissions": ["model.design", "sequencer.control", "roi.forecast"],
    "tone": "strategic",
    "visibleUI": ["sequencer", "roiDashboard", "architectureMap"],
    "skills": ["transformation_modeling", "scenario_analysis"],
    "description": "Strategic modeling for transformation and ROI/TCC analysis."
  }
}
```

#### 2️⃣ modeSwitcher.ts (Core Logic)
```ts
import modes from '@/data/config/modes.json';
import { emitTelemetry } from '@/lib/telemetry/agent';
import { applyToneProfile } from '@/lib/agent/toneProfiles';

let currentMode = 'user';

export function switchMode(newMode: string) {
  if (!modes[newMode]) {
    console.warn(`Invalid mode: ${newMode}`);
    return;
  }

  const config = modes[newMode];

  // Update permissions and skills
  updatePermissions(config.permissions);
  loadSkills(config.skills);

  // Adjust tone and UI
  applyToneProfile(config.tone);
  toggleUIComponents(config.visibleUI);

  // Telemetry event
  emitTelemetry({
    event: 'mode_switch',
    from: currentMode,
    to: newMode,
    timestamp: new Date().toISOString(),
    context: config.description
  });

  currentMode = newMode;
  console.info(`Switched to mode: ${newMode}`);
}

function updatePermissions(permissions: string[]) {
  // Placeholder: integrate with access control middleware
  console.debug('Permissions updated:', permissions);
}

function loadSkills(skills: string[]) {
  // Placeholder: dynamically register mode-specific skills or LLM prompts
  console.debug('Skills loaded:', skills);
}

function toggleUIComponents(visibleUI: string[]) {
  // Placeholder: conditionally render UI components
  document.querySelectorAll('[data-ui]').forEach(el => {
    const id = el.getAttribute('data-ui');
    el.classList.toggle('hidden', !visibleUI.includes(id));
  });
}
```

#### 3️⃣ Example Mode Change Usage
```ts
// Switch to founder mode
switchMode('founder');

// Switch to architect mode for scenario modeling
switchMode('architect');

// Revert to standard user mode
switchMode('user');
```

#### 4️⃣ Example EAgent Response Template
```json
{
  "mode": "founder",
  "agent_response": "Welcome back, Z. System control restored.",
  "tone": "analytical",
  "ui_state": ["directivePanel", "systemTelemetry", "agentConsole"]
}
```

#### 5️⃣ Deliverables
- `/data/config/modes.json` — Base configuration file
- `/lib/context/modeSwitcher.ts` — Core mode management logic
- `/lib/agent/toneProfiles.ts` — Tone handling utility
- `/tests/e2e/mode_switching.spec.ts` — Playwright spec for switching behavior

---

### ✅ Implementation Snapshot (Codex)

- Added `data/config/modes.json` with the founder/user/demo/research/test/support/architect definitions.
- `src/lib/context/modeSwitcher.ts` (client-side module) exposes `switchMode/getCurrentMode`, updates tone via `applyToneProfile`, toggles `[data-ui]` regions, and registers `window.FuxiModeSwitcher`.
- `ModeBridge` is injected via `src/app/layout.tsx` so every page makes the bridge available to Playwright and manual demos.
- Playwright spec `tests/e2e/mode-switching.spec.ts` exercises the bridge by switching from user → founder → demo.
