## Directive D030: Harmonization Header Adaptation

### Purpose
Enhance the `harmonizeSystems()` pipeline to accept alternate header names for system identity, dependencies, and domain context, improving robustness and user onboarding for real-world data exports.

---

### Implementation Tasks

**Target files**
- `/src/domain/services/harmonization.ts`
- `/src/domain/services/ingestion.ts` (if shared normalization logic)

**Core changes**
Add flexible header resolution before ingest:

```ts
function resolveField(row: any, keys: string[]): string {
  for (const key of keys) if (row[key] && String(row[key]).trim() !== '') return row[key];
  return '';
}

const label = resolveField(row, ['label', 'Raw_Label', 'Logical_Name']);
const systemName = resolveField(row, ['system_name', 'Logical_Name', 'Raw_Label']);
const domain = resolveField(row, ['domain', 'Domain']);
const upstream = resolveField(row, ['upstream', 'Dependencies_Upstream']);
const downstream = resolveField(row, ['downstream', 'Dependencies_Downstream']);
const state = resolveField(row, ['state', 'Disposition_Interpretation']);
const stateColor = resolveField(row, ['state_color', 'Disposition_Color']);
```

Apply `label` and `systemName` fallbacks before node construction.  

---

**Telemetry Updates**
- Add event field `header_mapping` in `harmonization_start` to record which fields were successfully detected.  
- Warn (not error) if < 70 % of expected headers are found.  

---

**Testing**
1. Drop `enterprise_current_state.csv` and `enterprise_future_state.csv` into `.fuxi/data/ingested/`.
2. Run:
   ```bash
   npx ts-node --transpile-only -e "const { harmonizeSystems } = require('./src/domain/services/harmonization'); harmonizeSystems();"
   ```
3. Verify:
   - Telemetry logs show `header_mapping` with resolved columns.
   - `.fuxi/data/harmonized/enterprise_graph.json` contains >0 nodes with domain and dependency data.

---

**Verification Criteria**
| Checkpoint | Description | Status | Verified By |
|-------------|-------------|--------|--------------|
| Header Flex Mapping | Non-canonical headers detected and resolved | ☐ | Codex |
| Graph Populated | >0 nodes generated | ☐ | Fuxi |
| Telemetry Header Mapping | Mapping recorded in event payload | ☐ | Mesh |

---

**Directive Metadata**
- **Project:** Fuxi_EA
- **Directive ID:** D030
- **Issued by:** EA Mesh (GPT-5)
- **Created by Agent:** Fuxi
- **Issued on:** 2025-11-30
- **Type:** Data Harmonization Enhancement
- **Priority:** High
- **Feature Branch:** `feat/d030_harmonization_header_adaptation`
- **Next Step:** Commit patch, re-run harmonization, validate telemetry and DE graph population.

