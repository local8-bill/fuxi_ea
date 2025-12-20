## 🛰️ Digital Twin Tech Spec – Current/Future Review Flow

### 📌 Objective
Document the production behaviour of the Digital Twin scene after harmonization data is uploaded. Users must verify Current vs Future changes domain-by-domain, save their review state, and only then proceed to Sequencer with full confidence.

---

### 🔁 Experience Flow
1. **Data Load**
   - `/api/digital-enterprise/view?project=…` returns `current`, `future`, and `diff` sets. When only a combined list exists we derive split datasets + diff sets client-side.
   - `/api/digital-enterprise/stats` seeds summary metrics and graph metadata.

2. **Domain Review**
   - Diff panel groups nodes by domain. Each item shows integration counts and upstream/downstream peers.
   - Users can:
     - **Send to Future** / **Return to Current** (manual overrides tracked client-side via `manualMoves`).
     - **Mark Done** per domain. Confirmed domains collapse from the list.
   - Left rail “Change Review” lists top 4 remaining domains and deep-links to the diff anchor.

3. **State Persistence**
   - `confirmedDomains` + `manualMoves` snapshot stored in `sessionStorage` (`fuxi_domain_review_${projectId}`) via “Save Review”. (Server persistence to follow.)

4. **Future Graph Preview**
   - Once all domains are marked done, the diff list collapses into:
     - A confirmation banner with Current/Future toggle + CTA “Build a Sequence”.
     - Live `GraphCanvas` loaded with the Future dataset (diff annotations on).
   - Users can inspect the harmonized architecture before opening Sequencer.
   - **Note:** Any component that appears in Current and shows no delta indicator is automatically treated as carried forward into Future; absence of change simply means it persists unchanged. This rule must be called out in-copy so reviewers understand that “no delta” = “kept as-is”.

5. **Sequencer Handoff**
   - “Build a Sequence” button simply triggers the existing option menu action (`setSequencePromptOpen(true)`), keeping the new review state intact.

---

### 🧱 Data Contracts
| Concern | Details |
| --- | --- |
| Graph API | Must return `current`, `future`, `diff`, or combined `nodes` with `state`. |
| Manual moves | Stored client-side; server endpoint TBD (future directive). |
| Sequence intent | Session storage payload (`fuxi_sequence_intent`) unchanged. |

---

### 🎨 UI States
1. **Review Active** – Domain cards, action buttons, and Change Review side panel.
2. **Awaiting Future Data** – Dashed placeholder, messaging to load Transition artifacts.
3. **No Deltas** – Same placeholder but messaging indicates “No changes detected”.
4. **All Domains Reviewed** – Confirmation banner + graph preview + CTA.

---

### ✅ Completion Criteria
- Domain review + manual overrides persist (session).
- Graph auto-switches to Future when all domains confirmed.
- Users can toggle Current/Future and launch Sequencer from the confirmation banner.
- Spec referenced by D089/D090 directives; any future layout or ALE changes must respect this baseline.

---

**Branch:** `feature/d090_digital_twin_tech_spec`  
**Approvers:** Agent Z (Bill), dx  
**Depends on:** D089 Unified Visual Framework, D085F ROI/TCC inputs  
