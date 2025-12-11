## 🧭 Directive D085F — Organizational Decision Topology (ODT)

### 🎯 Objective
Model the *human system* that drives (or stalls) transformation decisions. The ODT captures influence, confidence, and bias dynamics across key decision makers, surfacing why alignment lags even when technical architecture is clear.

This directive introduces a reusable analytical framework — every major transcript (e.g., MDM Alignment, OMS Sequencing, Platform Replacement) can instantiate its own topology view.

---

### 🧩 Concept Overview

| Dimension | Description | Data Source |
|------------|--------------|--------------|
| **Decision Gravity** | Magnitude of influence exerted on decision trajectory | Transcript reasoning → speaker dominance metrics |
| **Confidence Vector** | Strength of conviction in statements / certainty bias | NLP tone + modal verb frequency |
| **Bias Type** | Primary decision posture (innovation, risk, ROI, stability) | ALE semantic clustering |
| **Cognitive Orbit** | Proximity to decision core (inner → peripheral) | Derived from gravity × confidence |
| **Convergence Index** | Group alignment metric (0–1) measuring directional agreement | ALE summarization synthesis |

---

### 🧱 Schema (Normalized Snapshot)

```json
{
  "context": "MDM Alignment Decision",
  "actors": [
    { "name": "Ralph Smith", "gravity": 0.9, "confidence": 0.75, "bias": "legacy_integrity", "role": "System Guardian" },
    { "name": "Thomas Kelly", "gravity": 0.7, "confidence": 0.6, "bias": "innovation_expansion", "role": "Vision Driver" },
    { "name": "Prasad Tendulkar", "gravity": 0.5, "confidence": 0.8, "bias": "value_rationalism", "role": "Value Narrator" },
    { "name": "Jesse Carstens", "gravity": 0.6, "confidence": 0.7, "bias": "integration_execution", "role": "Mediator" },
    { "name": "Siva Boothathan", "gravity": 0.4, "confidence": 0.9, "bias": "risk_aversion", "role": "Stabilizer" },
    { "name": "Nick Smotek", "gravity": 0.8, "confidence": 0.5, "bias": "alignment_synthesis", "role": "Decision Synthesizer" }
  ],
  "metrics": {
    "convergence_index": 0.58,
    "dominant_bias": "stability_vs_innovation",
    "phase": "Rationalization"
  }
}
```

---

### 🧮 ALE Derivation Pipeline

```bash
[Transcript NLP Parsing]
     ↓
(Turn-taking analysis → speaker dominance → decision gravity)
     ↓
(Sentiment + modality extraction → confidence vectors)
     ↓
(Semantic clustering → bias typology)
     ↓
(ALE normalization → /api/ale/org-intelligence/decision-topology)
```

---

### 🧠 Readout Example
**MDM Alignment Meeting — Topology Summary**

> *Decision group exhibits cognitive loop in Stage 2 (Rationalization). Structural and innovation biases are polarized (Ralph ↔ Thomas). ROI rationalists (Prasad, Jesse) mediate without closure. Chief EA (Nick) remains alignment absorber with insufficient confidence reinforcement.*

**Recommendation:** Introduce *Scenario Proofing View* (ROI/TCC comparison) to trigger transition to Stage 3 (Evidence Convergence). Assign ownership anchor (Ralph) with narrative reinforcement (Jesse) to accelerate alignment.

---

### 🧭 Visualization Layout
**Graph Type:** Polar orbit chart (influence → confidence)

| Element | Meaning |
|----------|----------|
| **Radius** | Confidence (outer = high conviction) |
| **Node size** | Decision gravity |
| **Node color** | Bias cluster (blue = stability, orange = innovation, green = ROI, gray = alignment) |
| **Orbit bands** | Cognitive proximity to core decision |

**Placement:** Left-nav → Intelligence → *Decision Dynamics* (toggle by context: OMS, MDM, Platform Migration, etc.)

---

### 📊 Mock Transcript-Derived JSON (Staging Dataset)

```json
{
  "context": "Inventory & MDM Decision",
  "actors": [
    { "name": "Ralph Smith", "gravity": 0.88, "confidence": 0.72, "bias": "legacy_integrity", "role": "System Guardian", "quotes": ["RMS and MFCS handle inventory truth.", "We need to minimize duplicate systems."] },
    { "name": "Thomas Kelly", "gravity": 0.73, "confidence": 0.64, "bias": "innovation_expansion", "role": "Vision Driver", "quotes": ["We should explore a centralized inventory model.", "It’s technically viable now."] },
    { "name": "Prasad Tendulkar", "gravity": 0.56, "confidence": 0.81, "bias": "value_rationalism", "role": "Value Narrator", "quotes": ["We must sequence this by ROI.", "Leadership needs an outcome-based justification."] },
    { "name": "Jesse Carstens", "gravity": 0.61, "confidence": 0.7, "bias": "integration_execution", "role": "Mediator", "quotes": ["We need to align MDM with OMS sequencing.", "The design must fit the execution path."] },
    { "name": "Siva Boothathan", "gravity": 0.45, "confidence": 0.88, "bias": "risk_aversion", "role": "Stabilizer", "quotes": ["We must avoid sync drift.", "The risk is in multiple truth sources."] },
    { "name": "Nick Smotek", "gravity": 0.82, "confidence": 0.54, "bias": "alignment_synthesis", "role": "Decision Synthesizer", "quotes": ["Let's consolidate the architectural options.", "We need alignment before we decide."] }
  ],
  "metrics": {
    "convergence_index": 0.57,
    "dominant_bias": "stability_vs_innovation",
    "phase": "Rationalization",
    "speaking_turns": 182,
    "total_duration_min": 87
  }
}
```

---

### 🧩 Visualization Configuration Schema

```json
{
  "nodeSize": {
    "min": 10,
    "max": 50,
    "scale": "gravity"
  },
  "radiusMapping": {
    "min": 50,
    "max": 200,
    "scale": "confidence"
  },
  "colorMap": {
    "legacy_integrity": "#3B82F6",
    "innovation_expansion": "#F97316",
    "value_rationalism": "#22C55E",
    "integration_execution": "#6366F1",
    "risk_aversion": "#EAB308",
    "alignment_synthesis": "#9CA3AF"
  },
  "orbitBands": [
    { "label": "Core Decision", "radius": 60 },
    { "label": "Mediators", "radius": 120 },
    { "label": "Peripheral Observers", "radius": 180 }
  ],
  "interactions": {
    "hover": "show actor name, bias, quote",
    "click": "open influence detail panel",
    "filter": ["bias", "role"]
  }
}
```

This schema defines how the orbit visualization should map actor attributes to visual variables, ensuring consistent rendering across contexts.

---

### 🔗 Integrations
- **Ingests**: Transcript summaries from ALE Reasoning Models (e.g., D085C-1R, D085C-2R)
- **Exports**: Influence metrics to Leadership Constellation (D085C)
- **Feeds**: ROI/TCC modules for cognitive readiness correlation
- **Alerts**: Triggers an Org Readiness drift warning if Convergence Index < 0.6

---

### 📊 Example Visual Insight (Narrative Overlay)
> *In MDM Alignment meetings, 70% of dialogue weight was held by two roles (Architect + Visionary), yet the dominant bias vectors diverged by 45° — predicting a 2.5-month delay in consensus. Introducing structured ROI framing reduces divergence by 18%.*

---

### ✅ Completion Criteria
1. **API** `/api/ale/org-intelligence/decision-topology` accepts normalized payload.  
2. **Visualization** renders orbit chart dynamically from transcript dataset.  
3. **Cognitive stage** detection reports correctly (Exploration → Rationalization → Convergence → Execution).  
4. **Cross-link** operational with Org Intelligence and ROI/TCC modules.  
5. **Narrative summary** available for export (Markdown / PDF brief for EA).  

---

**Branch:** `feature/org-decision-topology`  
**Owners:** Agent Z (Bill), dx  
**Series:** D085C → D085F  
**Status:** Draft Ready / Integration Pending

