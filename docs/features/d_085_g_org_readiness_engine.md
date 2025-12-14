## Directive D085G – Organizational Readiness Engine (Behavioral + Change Index)

### 🌐 Objective
Create a behavioral and structural readiness model to assess an organization’s preparedness, willingness, and capability to execute transformation programs. This model predicts both *readiness to proceed* and *likelihood of success*, integrating human and operational data directly into the Sequencer and ROI/TCC simulation layers.

---

### 📊 Dimensions of Readiness
| Dimension | Description | Measurement Method | Typical Data Source |
|------------|--------------|--------------------|--------------------|
| **Business Readiness** | Structural maturity to absorb and operationalize change. | % of processes mapped, leadership engagement, policy clarity. | Interviews, documentation review. |
| **Business Willingness** | Emotional and political appetite for change. | Sentiment in comms, survey tone, engagement level. | EAgent logs, meeting transcripts. |
| **Business Capability** | Resource and skill capacity to execute transformation. | Budget health, staffing ratios, historical delivery velocity. | HR/Finance data, project metrics. |
| **Business Urgency** | Competitive or regulatory pressure to act. | Time-to-risk, market indicators, leadership statements. | Strategy docs, external data feeds. |
| **Resistance to Change** | Inertia or active pushback from within the organization. | Sentiment variance, governance blockers, dissent rate. | Feedback /feedback channel, sentiment engine. |
| **Support Presence** | Strength and continuity of executive sponsorship. | Sponsor participation, cross-functional alignment. | Org charts, meeting analytics. |

---

### ⚙️ Weighted Readiness Function
The composite readiness score \( R \) combines the six dimensions using tunable weights:

\[
R = (\alpha * Readiness) + (\beta * Willingness) + (\gamma * Capability) + (\delta * Urgency) - (\varepsilon * Resistance) + (\zeta * Support)
\]

| Org Type | α | β | γ | δ | ε | ζ |
|-----------|---|---|---|---|---|---|
| Product-led | 0.25 | 0.15 | 0.25 | 0.15 | 0.10 | 0.10 |
| Service-led | 0.20 | 0.15 | 0.30 | 0.10 | 0.15 | 0.10 |
| Hybrid | 0.22 | 0.18 | 0.22 | 0.18 | 0.10 | 0.10 |

Readiness scores normalize to a 0–1 range.

---

### 🔍 Success Probability Model
Program success probability \( P_s \) is derived from readiness, urgency, and resistance:

\[
P_s = \frac{1}{1 + e^{-(aR + bU - cE)}}
\]

Where:
- `R` = readiness composite
- `U` = urgency
- `E` = resistance
- `a, b, c` = tunable constants calibrated from case data

Output: **Predicted Success Rate (%).**

---

### 🔢 Data Inputs
**Quantitative:** budget, headcount, elapsed project durations.
**Qualitative:** transcripts, feedback, EAgent sentiment.
**Behavioral:** scenario runs, collaboration frequency, Sequencer interactions.

All inputs are normalized to confidence-weighted signals within the ALE store.

---

### 🔄 Output Visualization
Displayed under Org Intelligence Reports and Sequencer overlays:

```
🤍 Organizational Change Readiness
- Business Readiness: 0.72 ✅
- Willingness: 0.64 ⚠️
- Capability: 0.78 ✅
- Urgency: 0.82 🔥
- Resistance: 0.31 🚫
- Support: 0.69 👍
Composite Score: 0.72
Predicted Success: 68% (Moderate Likelihood)
```

---

### 🧠 Adaptive Recommendations
Low dimensions trigger targeted guidance, e.g.:
- **Resistance high:** conduct co-design sessions with operational leadership.
- **Capability low:** recommend phased rollout and skill enablement.
- **Urgency low:** align transformation goals with external pressures.

---

### 🛰️ Integration Map
| Component | Dependency | Description |
|------------|-------------|--------------|
| **D085C** | Org Intelligence Reports | Consumes readiness data for reporting. |
| **D085A** | Sequencer | Uses readiness to influence phase probability and pacing. |
| **D084D** | ALE Integration Layer | Provides learning loop updates based on user behavior. |

---

### 📊 Completion Criteria
- Readiness dimensions and weighting logic implemented.
- Data pipeline from Org Intelligence Reports to Sequencer active.
- UI visualization for readiness & success probability integrated.
- Recommendations surfaced contextually in EAgent or insights panel.

**Branch:** `feature/org-readiness-engine`  
**Approvers:** Agent Z (Bill), dx  
**Dependencies:** D085A, D085C, D084D

