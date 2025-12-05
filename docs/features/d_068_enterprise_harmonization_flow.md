## 🧭 Directive D068 – Enterprise Platform Harmonization & Sequencing Flow

### Purpose
Unify the existing ingestion, harmonization, and sequencing capabilities under the Conversational Agent framework, enabling an architect to evaluate 5–10 platforms and generate a modernization roadmap through a single conversational flow. This directive refines existing logic and introduces **no new features**.

---

### Scope
Applies to:
- `ConversationalAgent.tsx` (context routing + prompts)
- `/api/ingestion/inventory` (platform tagging logic)
- `/api/harmonization` and `/api/sequence` (existing computation endpoints)
- `data/sessions/{projectId}.json` (context state)

Supersedes:
- Fragmented harmonization and sequencing page flows.

Extends:
- D066: Conversational Agent (Persistent Shell Companion)
- D067: Conversational Onboarding Integration

---

### Objectives
1. Allow architects to focus on *platform-level* planning instead of system-by-system navigation.
2. Drive ingestion → harmonization → sequencing through conversational prompts.
3. Preserve all existing logic; only re-route via the agent.
4. Produce a concise, visually consistent roadmap output (3–5 waves).

---

### Conversational Flow

#### 1️⃣ Platform Context
```
Agent: Which enterprise platforms are you assessing today? (ERP, CRM, Commerce, Data…)
User: ERP, Data, Finance.
```
→ Context saved: `focusPlatforms = ['ERP','Data','Finance']`

#### 2️⃣ Data Ingestion
```
Agent: Do you want to upload your current state, future state, or full tech inventory?
User: Current and future.
```
→ Agent triggers `/api/ingestion/inventory` for both uploads.  
→ Files tagged with `platform` and `state` metadata.

#### 3️⃣ Harmonization Summary
```
Agent: I’ve harmonized 42 systems across 3 platforms.  
ERP and Finance show the most overlap.  
Would you like to review by platform or capability?
```
→ Uses existing harmonization logic; filters results by platform.

#### 4️⃣ Sequencing Conversation
```
Agent: Based on dependencies, here are three modernization waves:  
Wave 1 – Finance core, Wave 2 – ERP integration, Wave 3 – Data optimization.  
Would you like to sequence by value or by complexity?
```
→ Calls `/api/sequence/plan` with platform filters and selected criteria.

#### 5️⃣ Roadmap Output
- Summarized as chat cards (no new UI components).  
- Each wave includes key platforms, dependencies, and TCC/ROI range.

---

### Implementation Notes
| Area | Adjustment | Status |
|-------|-------------|--------|
| **ConversationalAgent.tsx** | Add platform context capture & pass to existing API calls. | 🔄 Minor |
| **Ingestion API** | Add `platform` and `state` tags to metadata schema. | 🔄 Minor |
| **Harmonization service** | Filter output by platform. | 🔄 Minor |
| **Sequencing service** | Accept `platform[]` param for wave generation. | 🔄 Minor |
| **UXShell / Chat** | Render roadmap cards inline. | ✅ Existing |

---

### Telemetry
| Event | Payload | Purpose |
|--------|----------|----------|
| `harmonization_completed` | `{ projectId, platforms, overlaps }` | Verify harmonization by platform |
| `sequencing_generated` | `{ projectId, strategy: 'value'|'complexity', waves }` | Track roadmap creation |
| `conversation_context_updated` | `{ focusPlatforms }` | Audit agent context continuity |

---

### Test Coverage
All existing Playwright and API tests will be extended to validate conversational routing and output fidelity.

#### **Playwright Tests (UAT Layer)**
| Test | Description | Directive Reference |
|-------|--------------|----------------------|
| `agent_harmonization_flow.spec.ts` | Simulates architect selecting 3 platforms → uploads → validates harmonization summary appears by platform name. | D068 |
| `agent_sequencing_flow.spec.ts` | Ensures sequencing responses produce 3–5 roadmap waves, rendered as chat cards. | D068 |
| `agent_context_persistence.spec.ts` | Confirms `focusPlatforms` persist across conversation steps and API calls. | D066–D068 |

#### **API Integration Tests**
| Endpoint | Test | Assertion |
|-----------|------|------------|
| `/api/ingestion/inventory` | Uploads tagged with `platform` + `state`. | Response includes metadata fields. |
| `/api/harmonization` | Returns results filtered by `platform[]`. | No system-level leakage. |
| `/api/sequence/plan` | Accepts `platform[]` param, returns waves. | Wave count 3–5, all entries tagged. |

#### **Telemetry Validation Tests**
| Event | Test | Expected Result |
|--------|------|-----------------|
| `harmonization_completed` | Fires on harmonization finish. | JSON payload includes `platforms` array. |
| `sequencing_generated` | Fires after roadmap generated. | Wave data serialized correctly. |

---

### Expected Outcome
- Architect uploads minimal artifacts and receives a harmonized, sequenced roadmap in one guided conversation.  
- No redundant UI pages; all flows driven through the existing agent and APIs.  
- Demonstrates Fuxi_EA’s core value: **context-aware enterprise reasoning**, without expanding the feature surface.

---

### Deliverables
- `[x]` Conversational harmonization + sequencing flow integrated.  
- `[x]` Platform context captured and passed to all APIs.  
- `[x]` Updated Playwright + API + telemetry tests.  
- `[x]` Release tag: `v0.7.1-harmonization-sequencing`.

