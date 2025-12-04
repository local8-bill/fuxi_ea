# D052B Total Cost of Change (TCC) Directive

## Purpose
This directive defines the implementation, validation, and telemetry standards for the **Total Cost of Change (TCC)** framework. The TCC model extends the ROI and transformation cost functions to measure the *full financial impact* of modernization, including human, operational, and risk-based factors.

## Scope
Applies to all modules consuming the ROI engine or financial forecasting services, including:
- `/domain/services/roiCalculator.ts`
- `/api/roi/forecast`
- ROI Dashboard visualizations
- Sequencer and Timeline stages with financial overlays

## Functional Objectives
1. Extend ROI API outputs to include `tcc_total` and `tcc_ratio`.
2. Integrate TCC composition visualization (stacked bar format) in ROI dashboard.
3. Emit telemetry event `tcc_computed` for each stage or domain where TCC is calculated.
4. Ensure harmonized data persistence for all input factors (C_project, C_transition, etc.).

## Formula Reference
```
TCC = C_project + C_transition + C_operational + C_human + C_risk
TCC_ratio = (C_transition + C_operational + C_human + C_risk) / C_project
```

### Component Ranges
| Cost Component | Typical Range (% of C_project) | Description |
|-----------------|--------------------------------|--------------|
| C_transition | 10–30% | Integration and migration effort |
| C_operational | 5–15% | Dual-running, downtime, or rework |
| C_human | 10–25% | Change enablement, training, communications |
| C_risk | 10–20% | Contingency, compliance, overruns |

## Acceptance Criteria
| ID | Criteria | Verification Method |
|----|-----------|---------------------|
| TCC-1 | TCC and TCC_ratio fields appear in API response | `/api/roi/forecast` JSON validation |
| TCC-2 | ROI dashboard displays stacked bar for TCC composition | Visual regression via Playwright UAT |
| TCC-3 | Telemetry logs include tcc_computed event | Telemetry log export review |
| TCC-4 | TCC ratio classification (Lean, Moderate, Complex) rendered correctly | UI snapshot or console log |

## Visualization & UX
- **TCC Overview Card** added to ROI summary panel.
- Tooltip reveals component breakdown and percentage.
- Color scheme:
  - Lean: green tone
  - Moderate: amber tone
  - Complex: red tone
- Interactive link to open supporting financial breakdown (domain-level).

## Telemetry Hooks
| Event | Payload | Purpose |
|--------|----------|----------|
| `tcc_computed` | `{ domain, tcc_total, tcc_ratio, classification }` | Confirms successful computation |
| `tcc_visualized` | `{ user_id, session_id, timestamp }` | Logged when user expands visualization |

## Dependencies
- D052 ROI Stabilization
- D051 ROI Dashboard (Domain Forecast)
- D061 Playwright UAT Layer (for automated validation)

## Deliverables
- Updated API: `/api/roi/forecast`
- New component: `TCCSummaryCard.tsx`
- UAT validation: added under `tests/ui/tcc_visualization.spec.ts`
- Documentation: Appendix added to `math_explainers.md`

## Status
🔄 In progress — Pending integration testing and UAT validation (tag `v0.7.1-TCC-baseline`)

