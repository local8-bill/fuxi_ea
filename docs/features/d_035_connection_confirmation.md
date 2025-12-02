## Directive D035 — Connection Confirmation & Guided Flow

### 🧾 Purpose
Enable users to move naturally from **project setup** through **artifact ingestion** and into **connection validation**, with adaptive, explainable AI inference and bounded context safeguards.

---

### 🧭 User Journey Overview

| Step | Page | User Action | System Behavior |
|------|------|--------------|----------------|
| 1 | **Home / New Project** | User names project | Creates project context + unique ID |
| 2 | **Project Intake** | Defines Industry, Drivers, Change Aggression | Persists metadata; influences inference thresholds |
| 3 | **Tech Stack (Ecosystem)** | Uploads artifacts (Excel, PPT, CSV, Image) | Harmonization normalizes data, generates inferred connections |
| 4 | **Connection Confirmation** | Reviews 5–10 AI-suggested connections per system | Progressive reveal, confirm/reject loop; feedback into harmonization |
| 5 | **Digital Enterprise View** | Displays validated graph | Confidence model recalibrates per confirmation |

---

### ⚙️ Technical Architecture

- `src/domain/services/connectionInference.ts` — Generates inferred edges using domain similarity, name proximity, and co-occurrence logic.
- `src/hooks/useConnectionConfirmation.ts` — Manages confirmation queue, user feedback, and persistence.
- `src/components/ConnectionPanel.tsx` — Displays focus system, suggested connections, and confirmation controls.
- `src/lib/confidenceModel.ts` — Recalculates weights and updates harmonization data per user input.

---

### 🧠 AI/UX Features

- **Bounded Context Guard:** Limit to 10 visible inferences at a time.
- **Confidence Threshold Slider:** Adjustable from 0.5–0.9 to control suggestion density.
- **Explainable Inference Hints:** e.g., *"Based on shared domain + co-occurrence in 2 uploaded artifacts."*
- **Undo & Rationale Persistence:** Users can revert or annotate decisions.
- **Adaptive Context Filtering:** Filters suggestions by current workspace (Tech Stack, Digital Enterprise, etc.).

#### Confidence-Based Filtering Logic Example

```ts
// src/hooks/useConnectionFiltering.ts
export function useConnectionFiltering(connections, confidenceThreshold) {
  const [visibleConnections, setVisibleConnections] = useState([]);

  useEffect(() => {
    const filtered = connections
      .filter(c => c.confidence >= confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // enforce bounded context (max 10)

    setVisibleConnections(filtered);
  }, [connections, confidenceThreshold]);

  return visibleConnections;
}
```

#### Behavior
- Adjusting the **slider** dynamically re-renders visible suggestions.
- Lower threshold (e.g., 0.5) → More suggestions, broader AI coverage.
- Higher threshold (e.g., 0.9) → Fewer, more confident connections.
- Telemetry logs each threshold adjustment via `connection_threshold_changed` event.

---

### 📈 Confidence Slider Flow

```
Confidence Threshold Adjustment → Filters Suggested Connections

  [0.5 - Broad]   →  10 suggestions (lower certainty, exploratory)
        ↓
  [0.7 - Balanced] →   6 suggestions (moderate certainty, typical default)
        ↓
  [0.9 - Narrow]   →   3 suggestions (high certainty, AI confident)

User adjusts slider → `connection_threshold_changed`
System updates visibleConnections[] → Re-renders visible nodes
Telemetry logs new threshold, visible count, and timestamp
```

---

### 📊 Telemetry Events

| Event | Trigger | Data |
|--------|----------|------|
| `connection_inferred` | AI suggests a new edge | system_a, system_b, confidence |
| `connection_confirmed` | User confirms suggestion | same + timestamp |
| `connection_rejected` | User rejects suggestion | same + reason |
| `connection_threshold_changed` | Slider adjusted | new threshold value |

---

### ✅ Verification Matrix

| Category | Check | Verified By |
|-----------|--------|--------------|
| **UX Flow** | Navigation: New Project → Intake → Tech Stack → Confirm | Fuxi |
| **Context Limiting** | ≤10 visible inferences | Fuxi |
| **Confidence Control** | Slider filters visible suggestions | Codex |
| **Persistence** | Confirm/reject decisions reflected in DE | Codex |
| **Telemetry** | Event logs consistent with user actions | Codex |

---

### 🔗 Dependencies

- **D033:** Harmonization
- **D034:** AI Inference Layer
- **D036:** Bounded Context Guidelines (to follow)
- **D024:** Intake Navigation Alignment (UX Consistency)

---

### 📈 Expected Outcomes

- Seamless flow from project creation to validated architecture.
- Simplified review of AI-suggested relationships.
- Self-tuning confidence model based on real user interaction.
- Structured telemetry foundation for future AI training.

---

**Branch:** `feat/d035_connection_confirmation`

**Tag after merge:**
```bash
git tag -a v0.6.3-connection-confirmation -m "D035: Connection Confirmation & Guided Flow"
git push origin v0.6.3-connection-confirmation
```

