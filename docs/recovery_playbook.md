# Fuxi EA Recovery Playbook

_Last updated: UXShell v0.3 + Telemetry Dashboard_

This note bootstraps a new Codex session (or a new developer) after context loss. Follow it to regain a working state quickly.

---

### TL;DR Script

Run `./scripts/recover_codex_session.sh` to print the current repo snapshot, verify `.env.local` / `.fuxi` assets, and re-list the core commands below. Use it whenever a new Codex instance (or teammate) needs an instant refresher before digging deeper into this doc.

---

## 1. Repo + Environment

### Commands
- `npm install` — install deps (Next.js 16.0.1 w/ Turbopack, Playwright)
- `npm run dev` — start local server
- `npm run beans` — lists common commands (dev, build, lint, Playwright, dev:nuke, telemetry scripts, generate:brand)
- `npx playwright test` — run full E2E suite (24 specs)

### Key Paths
- `src/components/experience/ExperienceShell.tsx` — canonical shell, Chat Mode, scene timing telemetry
- `src/components/experience/scenes/…` — scene modules (Digital Twin, ROI, Onboarding, Insights)
- `src/components/uxshell/Sidebar.tsx` — Projects/Views/Modes nav (+ “Intelligence” shortcut under Modes)
- `src/app/api/telemetry/…` — ingestion + `/metrics` aggregation
- `.fuxi/data/telemetry_events.ndjson` — local telemetry log
- `src/data/designLocks.ts` — rationale we feed EAgent (mirrored in `docs/design_locks.md`)

---

## 2. Directives Locked In

| Directive | Status | Notes |
| --------- | ------ | ----- |
| D060A Sidebar | ✅ | Projects/Views/Modes structure enforced (`NavSection`, `useChevronNav`). |
| D066E Conversational Nav | ✅ | Chat Mode + unified prompt routing, `agent_mode_switch` telemetry, search modal. |
| D070B Digital Twin | ✅ | Guided focus flow, telemetry cards, focus pulse stored. |
| D062/D067 Onboarding | ✅ | Remodeled scene under Experience Shell, auto-proceed toggle, telemetry. |
| D071 Command Deck Home | ✅ | `/home` Playwright coverage; `/` redirects to `/home`. |
| D075 Anticipatory Preview | ✅ | E2E covered via command deck spec. |
| Telemetry Dashboard | ✅ | `scene_viewed`, `agent_message_sent`, `decision_taken`, `ai_trust_signal`, `pulse_state_change` events aggregated and visualized in Insights scene. |

---

## 3. Recovery Steps

1. **Install + run dev server**
   ```bash
   npm install
   npm run dev
   ```

2. **Verify telemetry files exist**
   - `.fuxi/data/telemetry_events.ndjson`
   - `.fuxi/data/telemetry/` (tone + conversation metrics)

3. **Run Playwright**
   ```bash
   npx playwright test
   ```
   Expect 24 passing specs (nav, command deck, digital twin, ROI, onboarding, insights, start page, sidebar behaviors, etc.).

4. **Check key pages manually**
   - `/project/700am/experience?scene=command` — Experience Flow header + Chat Mode inside card.
   - `/project/700am/experience?scene=digital` — focus rail, graph, telemetry pulse in right rail.
   - `/project/700am/experience?scene=roi` — summary + TCC + telemetry cards.
   - `/project/700am/experience?scene=onboarding` — forms, upload panel, “Recent guidance”.
   - `/project/700am/experience?scene=insights` — telemetry dashboard cards + charts.

5. **Beans reference**
   - `npm run beans` prints: dev, build, lint, `npx playwright test --trace=on`, `npm run collect:videos`, `npm run dev:nuke`, `node scripts/telemetry-summary.js`, `npm run generate:brand`, etc.

6. **Telemetry sanity check**
   ```bash
   tail -f .fuxi/data/telemetry_events.ndjson
   curl localhost:3000/api/telemetry/metrics
   ```
   Should show navigation/conversation/decision/trust/pulse aggregates.

---

## 4. Pending / Nice-to-have

- Refresh “New Project” flow (`/project/new`) to use Experience Shell.
- Reintroduce ROI Pulse card once design is finalized.
- Document telemetry dashboard in `docs/features`.
- Optional backfill script for new events (currently logging from April 2025 onward).

Keep this file updated whenever the shell, directives, or telemetry architecture changes. It’s the quick-reference to get a “new” Codex instance aligned with the current state.
