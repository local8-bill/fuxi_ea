# Scoring UI Alignment with Tech Stack

## Goals
- Make the Scoring page feel structurally identical to Tech Stack Workspace.
- Reuse the same “uploads + summary” mental model:
  - Upload → Normalize → Analyze
- Reduce scattered controls into a single, purposeful controls card.

## Desired Layout

1. **Header (keep as-is, already aligned)**
   - `Project: {id}`
   - `Capability Scoring Workspace`
   - Short description subtext.

2. **Controls Card ("Capability Controls")**
   - Combine current filter/sort bar + Add L1 button into a single card:
     - Domain filter (select)
     - Sort by: Name | Score
     - Add L1
     - Weights button
     - Vision toggle (Labs) – optional/chip style

3. **Uploads Section (mirror Tech Stack behavior)**
   - Use the same layout pattern as Tech Stack:
     - "Import CSV/JSON" (capability map)
       - Uses existing `ImportPanel` under the hood.
     - "Upload Image / PDF" (capability diagram)
       - Uses `VisionPanel` under the hood.
   - Both treated as “inputs to the capability model”, analog to inventory + diagrams in Tech Stack.

4. **Main Capability Grid**
   - Keep existing grouped/ungrouped grid behavior.
   - Just ensure padding and card styling matches Tech Stack page spacing.

5. **Drawers / Dialogs**
   - `ScoringDrawer`, `WeightsDrawer`, `AddL1Dialog` remain unchanged.
   - Triggered from controls + cards, but visually consistent with Tech Stack’s card/spacing.

## Implementation Notes
- Reuse `ImportPanel` and `VisionPanel` where possible instead of new components.
- Keep feature flags (`LABS_IMPORT`, `LABS_VISION`) but consider hiding Vision in production.
- No changes to scoring logic or data; this is strictly a layout/UX pass.
