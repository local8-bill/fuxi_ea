## 🧭 Directive D077B-S — Provenance + Snapshot Routine (OMS Pilot)

### 🎯 Objective

Once the **Intent ⇄ Sequencer Loop (OMS Pilot)** is verified as stable, this directive defines the process for **capturing a clean provenance snapshot** of the state, code, and data associated with the working feature — ensuring full reproducibility and traceability inside the Fuxi ecosystem.

---

### 🧩 Provenance Scope

| Layer | Artifact | Purpose |
|--------|-----------|----------|
| Source Code | `/lib/sequencer/*`, `/hooks/useSequencer.ts`, `/app/dev/graph-prototype/*` | Capture exact operational wiring of the OMS loop. |
| Data Snapshot | `/data/graph/oms_transformation_live.json` | Immutable JSON export of harmonized graph data post-pilot. |
| Directive Docs | `d_077b_oms_pilot.md` + `d_077b_snapshot_provenance.md` | Record the reasoning lineage and implementation scope. |
| Validation Log | `/tmp/intent_oms_pilot.log` | Audit trail of successful intents → sequencer mutations. |
| Commit Tag | `snapshot/oms-intent-pilot@YYYY-MM-DD` | Git reference for reproducibility. |

---

### 🧱 Step-by-Step Snapshot Routine

1️⃣ **Verify pilot stability**  
   - Run local instance `npm run dev` → trigger `/intent` command(s).  
   - Confirm console shows:  
     `✅ Intent captured` → `⚙️ Sequencer updated` → `🧩 Graph synced`.

2️⃣ **Freeze graph data**  
   ```bash
   curl "http://localhost:3000/api/digital-enterprise/view?project=700am&mode=all" \
     -H "Content-Type: application/json" \
     --output src/data/graph/oms_transformation_live.json
   ```

3️⃣ **Record provenance metadata**  
   ```bash
   git add docs/features/d_077b_oms_pilot.md \
           docs/features/d_077b_snapshot_provenance.md \
           src/data/graph/oms_transformation_live.json
   git commit -m "snapshot: OMS Intent Pilot stable + provenance capture"
   git tag snapshot/oms-intent-pilot@$(date +%Y-%m-%d)
   ```

4️⃣ **Push safety copy**  
   ```bash
   git push origin main --tags
   git push origin HEAD:refs/heads/safety/oms-intent-pilot
   ```

5️⃣ **Generate validation checksum**  
   ```bash
   shasum src/data/graph/oms_transformation_live.json > docs/features/oms_graph_checksum.txt
   ```

6️⃣ **Close loop with provenance manifest**  
   - Update `docs/features/d_077b_oms_pilot.md` → append tag & checksum.  
   - Record metadata in internal manifest (if active):
     ```json
     {
       "directive": "D077B-OMS-Pilot",
       "tag": "snapshot/oms-intent-pilot@YYYY-MM-DD",
       "checksum": "<SHA>",
       "capturedBy": "Agent Z",
       "verifiedBy": "dx"
     }
     ```

---

### 🔁 Rollback Routine

In the event that the OMS Intent Loop introduces instability or breaks downstream graph rendering, execute the following rollback:

1️⃣ **Reset local state to last stable tag:**
```bash
git checkout snapshot/oms-intent-pilot@<last-known-good>
```

2️⃣ **Restore graph dataset:**
```bash
cp src/data/graph/oms_transformation_live.json.backup src/data/graph/oms_transformation_live.json
```

3️⃣ **Restart local instance:**
```bash
npm run dev
```

4️⃣ **Validate via console:**
Confirm baseline message:  
`✅ Loaded static OMS dataset (rollback)`

5️⃣ **Document rollback:**
Append rollback notice in `docs/features/d_077b_snapshot_provenance.md` with timestamp and reason.

6️⃣ **Notify maintainers:**
Ping Fuxi channel + Agent Z for revalidation and resequencing of latest changes.

---

### ✅ Completion Criteria
- All six steps executed successfully.  
- Git tag and data snapshot committed.  
- Console and validation logs show no open errors.  
- Directive D077B-OMS-Pilot updated with provenance block.  
- Rollback instructions verified and functional.

---

**Branch:** `safety/oms-intent-pilot`

**Approvers:** Agent Z (Bill), dx

**Purpose:** Create a fully traceable reference point for the working OMS Intent Pilot — enabling later recovery, reproducibility, and learning provenance inside the ALE.

