## Directive D034 — Transformation Dialogue Layer (Addendum A)

### Enhancement Purpose

Expand D034 to include **AI-assisted inference** and **domain sorting/filtering**, allowing users to accelerate transformation planning with pre-suggested actions and better domain organization.

---

### 🧠 AI-Assisted Transformation Inference

**Objective:** Automatically infer the most probable transformation intent (Replace, Modernize, Retire, Keep) for each system based on harmonization deltas and metadata.

#### Inference Logic

| Harmonization State | Confidence | AI Suggestion               | Example                       |
| ------------------- | ---------- | --------------------------- | ----------------------------- |
| **Added**           | > 0.7      | Replace or New Introduction | Commerce Engine replaces ATG  |
| **Removed**         | > 0.7      | Retire or Consolidate       | DOMS retired; replaced by OMS |
| **Modified**        | > 0.5      | Modernize or Replatform     | Oracle EBS → EBS Cloud        |
| **Unchanged**       | > 0.8      | Keep as-is                  | Salsify remains PIM           |
| **Unknown**         | —          | Ask user                    | Unmapped domain items         |

#### Implementation

- Add `ai_suggestion` field to harmonized data:
  ```json
  {
    "system_name": "EBS Order Mgmt",
    "domain": "ERP",
    "state": "Removed",
    "confidence": 0.88,
    "ai_suggestion": "Retire"
  }
  ```
- Introduce `src/domain/services/aiInference.ts`:
  ```ts
  export function inferTransformation(system: HarmonizedSystem): AIAction { ... }
  ```
- On `transformation-dialogue/page.tsx`, preselect suggested radio button:
  > 💡 *AI suggests “Retire” based on removal from future state.*

#### Telemetry Additions

| Event                        | Trigger                       | Data                                          |
| ---------------------------- | ----------------------------- | --------------------------------------------- |
| `ai_inference_applied`       | AI assigns initial suggestion | system\_id, ai\_suggestion, confidence        |
| `user_override_ai_inference` | User changes suggested option | system\_id, previous\_suggestion, new\_action |

---

### 🧭 Domain Sorting and Filtering

**Goal:** Improve UX clarity by enabling users to group, filter, and sort transformation cards by domain.

#### Implementation

- Add client-side sorting:
  ```tsx
  const [sortKey, setSortKey] = useState("domain");
  const sortedSystems = useMemo(
    () => systems.sort((a, b) => a.domain.localeCompare(b.domain)),
    [systems]
  );
  ```
- Add dropdown filter:
  ```tsx
  <Select value={domainFilter} onValueChange={setDomainFilter}>
    <SelectItem value="All">All Domains</SelectItem>
    {uniqueDomains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
  </Select>
  ```

#### Optional Filters

-

---

### Verification Additions

| Checkpoint    | Description                                    | Status | Verified By |
| ------------- | ---------------------------------------------- | ------ | ----------- |
| AI Suggestion | Each system prefilled with AI-suggested action | ☐      | Codex       |
| User Override | Users can override AI-suggested options        | ☐      | Fuxi        |
| Domain Sort   | Systems sortable/filterable by domain          | ☐      | Mesh        |
| Telemetry     | AI + user overrides captured                   | ☐      | Fuxi        |

---

### 🧪 QA Checklist (AI Inference Validation)

#### Functional Tests

1. **Inference Accuracy Test** – Verify that AI-suggested actions match expected state logic for 20 random systems across domains.
2. **Override Behavior Test** – Confirm that user overrides are logged and persist correctly when the page reloads.
3. **Mixed Confidence Handling** – Ensure systems with low-confidence (<0.5) show a “Needs Review” flag instead of pre-selection.
4. **Telemetry Integrity** – Validate `ai_inference_applied` and `user_override_ai_inference` events with correct payloads in `.fuxi/data/telemetry_events.ndjson`.

#### UX Tests

1. Domain dropdown correctly filters cards.
2. Sorting by domain, state, or confidence updates UI in under 150ms.
3. “AI-only” and “User-overridden” filters display correct subsets.

#### Edge Tests

1. Systems with missing domain field appear under “Other.”
2. Systems with identical names but different domains render unique keys.
3. Large datasets (500+ systems) maintain smooth interaction under 1s render time.

---

### Next Steps

- Codex: Extend D034 implementation to include `aiInference.ts` + domain sorting.
- Fuxi: Validate suggestion accuracy vs. harmonization results.
- Mesh: Confirm telemetry patterns align with D020 schema.

---

**Branch Update:** `feat/d034_transformation_dialogue_layer` continues — no new branch required.

**Tag After Completion:**

```bash
git tag -a v0.6.2-ai-inference -m "Addendum A: AI-assisted inference and domain sorting for D034"
git push origin v0.6.2-ai-inference
```

