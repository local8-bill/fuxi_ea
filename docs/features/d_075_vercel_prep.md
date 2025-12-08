## 🧭 Fuxi_EA Deployment Readiness Plan (Pre-Vercel)

### 🔧 Phase 1: Test Stability & Verification

**Key Blocker:**  
`tests/e2e/*.spec.ts` – Only `digital_twin_flow` passes. Other Playwright specs (nav, command deck, ROI, sidebar) timeout or mismatch UXShell v0.3.

**Action Plan:**  
1. Run: `npx playwright test --project=chromium --workers=2`  
2. Fix failing specs (especially nav + sidebar tests) per D066D/D060A.  
3. Refactor selectors using `data-testid` attributes for stability.  
4. Ensure all specs pass locally before merging to `main`.

**Deliverable:**  
✅ 100% Playwright suite pass  
✅ Attach `playwright-report/summary.json` to CI artifacts  

**ETA:** 1.5–2 days (High effort)

---

### 🧩 Phase 2: TypeScript Compile Integrity

**Key Blocker:**  
`npx tsc --noEmit` fails from legacy typing issues in `src/components/uxshell` and data mocks.

**Action Plan:**  
1. Run: `npx tsc --noEmit > tsc.log`  
2. Fix typing errors in:
   - `src/components/uxshell/*` (layout props mismatch)
   - `src/types/telemetry.ts` (telemetry unions)
   - `src/data/mocks/*` (type widening)
3. Temporarily use `skipLibCheck: true` only for local validation.

**Deliverable:**  
✅ Clean compile (0 errors)  
✅ No `skipLibCheck` in production config  

**ETA:** 0.5–1 day (Medium effort)

---

### 🧠 Phase 3: UXShell Layout Refinement (Command Deck + Digital Twin)

**Command Deck Fixes**  
- Remove nested `<UXShellLayout>` rendering inside `ExperienceShell.tsx` (lines 70–155).  
- Replace with simplified `<CommandDeckScene>` using a single shell wrapper.  
- Validate persona copy (Architect / Analyst / Change Leader).

**Digital Twin Polish**  
- Update `DigitalEnterpriseClient.tsx` (lines 29–508):
  - Apply `bg-slate-950` dark canvas.  
  - Dropdown-only controls.  
  - Progressive insight reveal (250ms stagger).  
  - Verify telemetry (`twin_view_opened`, `twin_graph_rendered`).

**Deliverable:**  
✅ No nested shells  
✅ Visual alignment with D070B  
✅ Telemetry verified  

**ETA:** 0.5–1 day (Medium effort)

---

### ⚙️ Phase 4: Tooling & CI Setup

**Key Blocker:**  
Dev setup scripts and telemetry summaries not fully documented.

**Action Plan:**  
1. Validate `/scripts/setup_dev_environment.sh` for Node 20+, Playwright deps.  
2. Update `README.md` with:
   ```bash
   npm run dev:nuke        # Clean rebuild
   npm run test:e2e        # Run Playwright suite
   npm run telemetry:summary
   ```
3. Add CI steps for Vercel:
   ```yaml
   - run: npx playwright install --with-deps
   - run: npx tsc --noEmit
   - run: npm run test:e2e
   ```

**Deliverable:**  
✅ Setup reproducible for new devs  
✅ CI pipeline aligned with local scripts  
✅ README up to date  

**ETA:** 0.25 day (Low effort)

---

### 🚀 Phase 5: Vercel Preview Validation

**Action Plan:**  
1. Push to `main` → validate auto-deploy to Vercel.  
2. Check:
   - `/digital-twin` uses UXShell v0.3 layout.  
   - `/roi-dashboard` single header (no ExperienceFlow).  
   - `/onboarding` doesn’t auto-redirect post-upload.  
3. Verify build logs for:
   - ✅ TypeScript passes
   - ✅ Tests green
   - ✅ Telemetry (HTTP 200s)

**Deliverable:**  
✅ Successful Vercel preview  
✅ All routes render correctly  
✅ No nav or agent regressions  

**ETA:** 0.5 day (Verification)

---

### 🧮 Effort Summary
| Task | Effort |
|------|--------|
| Playwright stabilization | High (1.5–2 days) |
| TypeScript cleanup | Medium (0.5–1 day) |
| Layout polish | Medium (0.5–1 day) |
| Tooling & Docs | Low (0.25 day) |
| Vercel validation | Low (0.5 day) |
| **Total** | **≈3–4 days total** |

