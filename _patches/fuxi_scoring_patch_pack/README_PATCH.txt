Fuxi — Scoring Patch Pack (function-first, no external UI deps)

Files included (drop-in replacements):
- src/features/capabilities/CapabilityProvider.tsx
- src/components/views/GridView.tsx
- src/components/scoring/ScoringSheet.tsx

What this gives you:
- Clean L3 → L2 → L1 rollups
- Optional L2/L1 overrides (checkbox in sheet)
- Simple, dependency-free sliders (native input[type=range])
- `compositeFor(id)` ready for KPIs/heatmaps
- Filter support via `query` + `domain` already in Provider

How to install:
1) Make a backup of your current files (optional but recommended).
2) Copy the files in this pack into your repo at the same paths.
3) Ensure you render both the grid and the scoring sheet inside the provider, e.g.:

   <CapabilityProvider>
     <div className="mx-auto max-w-6xl p-6">
       <GridView />
     </div>
     <ScoringSheet />
   </CapabilityProvider>

4) npm run dev → click an L2 row → sheet opens → adjust sliders.
