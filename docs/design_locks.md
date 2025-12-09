# UXShell Design Locks (Agent Seed)

These are the non-negotiable UX decisions we encoded for EAgent. Each lock references the directive that drove it, the core rationale, and the files that enforce it.

| ID | Directive | Principle | Guardrails |
| --- | --- | --- | --- |
| `left_lane_lock` | D060A / D066E | Left navigation schema is immutable. | Projects / Views / Modes in that order, Intelligence as its own branch, no pills, Digital Twin / Sequencer / Review sit beside ROI, persistence keys fixed. |
| `chat_mode_in_flow` | D066E | Chat Mode belongs inside the Experience Flow card. | Right rail reserved for telemetry; only one prompt bar; toggle simply deck ↔ agent. |
| `experience_alignment` | D060 | Shell spacing aligns with the sidebar + right rail. | Shared gutters, UXShell grid, no “UX inception” padding drifts. |
| `digital_twin_canvas` | D070B | Digital Twin owns the main canvas. | Graph gets the height; Recognition/Guided Focus ride below it; telemetry stays in the rail. |
| `telemetry_first_class` | Telemetry Dashboard / D075 | Every scene emits + consumes telemetry. | `scene_viewed`, `scene_view_time`, `agent_message_*`, `decision_taken`, `ai_trust_signal`, `/api/telemetry/metrics`. |

Source of truth lives in `src/data/designLocks.ts`; this doc is just a quick human view. If you add a new lock, update both files so EAgent and the team stay in sync.
