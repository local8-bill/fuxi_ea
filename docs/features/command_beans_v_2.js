## Directive D086A – Command Beans Registry (v2)

### 🎯 Objective
Establish a unified developer command registry for all local Fuxi engineering tasks — replacing ad‑hoc npm scripts with a consistent, human‑readable, and scriptable command index. The registry provides a single command (`npm run beans`) that lists and categorizes available dev/ops scripts, ensuring maintainability and discoverability across teams.

---

### 🧩 Purpose
- Reduce cognitive load for developers by grouping related commands (core, data, learning, testing).
- Serve as the seed for the upcoming **Fuxi CLI Framework**, allowing agents like `dx` to call, describe, and automate commands contextually.
- Provide a single source of truth for command naming conventions, dependencies, and feature coverage (D077, D080, D084, D085 families).

---

### ⚙️ Implementation Code
```javascript
#!/usr/bin/env node
/**
 * Fuxi Command Beans (v2)
 * Lightweight developer command registry for core, data, and testing ops.
 * Clean aliases, clear purpose, zero fluff.
 */

const beans = {
  core: [
    { cmd: "npm run dev", desc: "Start Next.js dev server" },
    { cmd: "npm run build", desc: "Compile production build" },
    { cmd: "npm run lint", desc: "Run ESLint checks" },
    { cmd: "npm run test", desc: "Run Vitest suite" },
    { cmd: "npm run dev:lan", desc: "Expose dev server to LAN (auto-detects IP)" },
    { cmd: "npm run dev:clean", desc: "Clear caches (.next/.turbo) then start fresh" },
  ],

  testing: [
    { cmd: "npx playwright test --trace=on", desc: "Run Playwright E2E with trace/video" },
    { cmd: "npx playwright show-report", desc: "Open Playwright report UI" },
    { cmd: "npm run collect:videos", desc: "Copy Playwright videos to report folder" },
  ],

  telemetry: [
    { cmd: "node scripts/telemetry-summary.js", desc: "Print recent telemetry events" },
    { cmd: "npm run verify:telemetry", desc: "Verify telemetry log integrity (D080)" },
  ],

  data: [
    { cmd: "npm run ingest:datadog [csv]", desc: "Seed Datadog service telemetry (D077B-II)" },
    { cmd: "npm run ingest:datadog:rollback", desc: "Rollback Datadog telemetry ingestion" },
  ],

  learning: [
    { cmd: "node scripts/dev/emit_test_events.js", desc: "Emit demo sequencer events (D077C-A)" },
    { cmd: "node scripts/dev/compute_learning_metrics.js", desc: "Read learning metrics snapshot" },
  ],

  brand: [
    { cmd: "npm run generate:brand", desc: "Generate metallic Fuxi crowns (D077)" },
  ],
};

console.log("\nFuxi Command Beans — Engineering Shortcuts\n");
for (const [section, list] of Object.entries(beans)) {
  console.log(`› ${section.toUpperCase()}`);
  list.forEach((b) => console.log(`  • ${b.cmd.padEnd(40)} ${b.desc}`));
  console.log();
}

console.log("Tip: Run with 'npm run beans' to display this list.\n");
```

---

### 🧠 Structure
| Category | Description | Directives Referenced |
|-----------|--------------|------------------------|
| **Core** | Build, dev server, and cleanup routines. | D060–D074 |
| **Testing** | End‑to‑end and integration validation. | D075 |
| **Telemetry** | Summarize, verify, and validate telemetry. | D080 |
| **Data** | Ingestion pipelines for Datadog and ALE. | D077B‑II |
| **Learning** | Emit and compute adaptive learning metrics. | D077C‑A |
| **Brand** | Generate visual identity assets. | D077 |

---

### 🔧 Setup Instructions
1. Save script as `scripts/command_beans.js`.
2. Add alias to `package.json`:
```json
"scripts": {
  "beans": "node scripts/command_beans.js"
}
```
3. Run via:
```bash
npm run beans
```

---

### 🧱 Rollback Procedure
If issues occur during merge or test:
```bash
git restore scripts/command_beans.js
git checkout main
git branch -D feature/command-beans-v2
```

---

### ✅ Completion Criteria
- Script categorized and aliased under `npm run beans`.
- Output prints all sections and descriptions in terminal.
- Verified in LAN and CI environments.
- Added to Command Beans registry under `/scripts`.

**Branch:** `feature/command-beans-v2`  
**Approvers:** Agent Z (Bill), dx  
**Dependencies:** None (standalone utility).
