# 🛠️ Directive D039 Addendum — Pre-D040 Ship Prep and Merge Instructions

## 🎯 Objective
Prepare for a confirmed, shippable baseline (v0.6.5-pre-d040) that includes:
- Completed work from D033–D039 (harmonization, DE visuals, refactor)
- Verification dashboard alignment
- Final code push, tag, and sanity tests before starting D040 (Mock Sequencer Pilot)

---

## 🔧 Step 1 — Local Commit and Merge

```bash
# Ensure all local work is committed
git add .
git commit -m "Finalize harmonization, DE graph visuals (D037–D039); ready for mock sequencer pilot prep"

# Rebase to latest remote main
git pull origin main --rebase

# Merge feature branch into main
git checkout main
git merge feat/d039_refactor_cleanup --no-ff -m "Merge D037–D039 changes to main"

# Tag release for traceability
git tag -a v0.6.5-pre-d040 -m "Pre-D040 release: DE graph, harmonization, cleanup, and flow readiness"

# Push updates and tag
git push origin main --tags
```

✅ Expected Result:  
- `main` branch reflects all implemented directives through D039  
- `v0.6.5-pre-d040` tag exists remotely  
- Working baseline ready for UAT

---

## 📊 Step 2 — Verification Dashboard Update

| Directive | Status | Notes |
|------------|---------|-------|
| D033 | ✅ Complete | Harmonization review and domain fidelity verified |
| D034 | ✅ Complete | Transformation dialogue implemented with telemetry |
| D035 | ✅ Complete | Connection confirmation, rationale, and undo persistence |
| D036 | ✅ Complete | Unified project flow and middleware gating |
| D037 | ✅ Complete | Graph visuals (edge palette, legend, focus interactions) |
| D038 | ✅ Complete | Code refactor, lint verification, and cleanup |
| D039 | 🚧 In Progress | Pre-ship merge, tag, and smoke test |
| D040 | 🔜 Planned | Transformation Sequencer (Mock Data Pilot) launch |

---

## 🤪 Step 3 — Post-Merge Sanity Tests

After merging and tagging:
```bash
npm run dev
```
Then confirm:

- [ ] App launches without error on `/project/[id]/digital-enterprise`
- [ ] Graph renders with **blue/violet/orange** edge palette
- [ ] Domain legend toggle and focus interactions work
- [ ] Upload workflow (Intake → Tech Stack → Harmonization) completes end-to-end
- [ ] `npm run build` passes successfully
- [ ] `/api/telemetry` tail shows harmonization_start / complete events

---

## 🚀 Step 4 — Handoff and Next Phase

After confirming `v0.6.5-pre-d040` runs cleanly:
- Mark D039 ✅ Complete  
- Proceed to **Directive D040 – Transformation Sequencer (Mock Data Pilot)**  
- Use the 10-system mock dataset from `/public/demo_data` as input  
- Simplify the Tech Stack upload interface to 3-step controlled ingestion

---

## 🟷️ Tag Metadata

```bash
git tag -a v0.6.5-pre-d040 \
  -m "Pre-D040 release baseline — DE visuals, harmonization cleanup, and verification readiness"
```

Tag owner: **Codex**  
Verifier: **Fuxi QA / UAT**  
Next branch: `feat/d040_transformation_sequencer`

---

## ✅ Acceptance Criteria
- [ ] Code merged and tagged as v0.6.5-pre-d040  
- [ ] Verification dashboard reflects up-to-date statuses  
- [ ] Sanity checks pass (upload flow, DE graph visuals, telemetry)  
- [ ] Ready to begin D040 implementation

