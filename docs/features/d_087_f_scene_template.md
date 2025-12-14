## 🧩 Directive D087F — Scene Template: ShadCN Graph Workspace

### 🎯 Objective  
Rebuild the prototype foundation from scratch using a clean, modular **scene template** pattern.  
No legacy components, no overrides, no layout ghosts.  
This becomes the canonical structure for *Digital Twin*, *Sequencer*, and *ROI Views*.

---

### 🧹 Pre-Cleanup
Before creating anything new:

1. **Delete** the following legacy files and folders:
   - `src/app/dev/graph-prototype/`
   - `src/app/dev/graph-reset/`
   - `src/components/graph/` (only prototype-specific files)
   - Any `NavSection`, `GraphNode`, `FocusLens`, or tile/pill components not used by production.
2. Confirm removal by running:
   ```bash
   git status
   # nothing left under src/app/dev/graph-prototype/
   ```
3. Commit cleanup as:
   ```bash
   git commit -m "chore: remove legacy graph prototype and UI debris"
   ```

---

### ⚙️ New Template Structure

**File:** `src/templates/SceneLayout.tsx`

```tsx
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function SceneLayout({
  left,
  main,
  right,
}: {
  left?: ReactNode;
  main: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Left Rail */}
      <aside className="w-[240px] border-r border-border p-4 space-y-2">
        {left ?? (
          <>
            <h2 className="text-sm font-semibold mb-2">Navigation</h2>
            <Button variant="ghost" size="sm">Build Sequence</Button>
            <Button variant="ghost" size="sm">Harmonize Stack</Button>
            <Button variant="ghost" size="sm">Create View</Button>
          </>
        )}
      </aside>

      {/* Main Graph Canvas */}
      <main className="flex-1 overflow-hidden p-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Graph Workspace</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100vh-150px)]">
            {main}
          </CardContent>
        </Card>
      </main>

      {/* Right Insight Rail */}
      <aside className="w-[280px] border-l border-border p-4">
        {right ?? (
          <Accordion type="single" collapsible>
            <AccordionItem value="inspector">
              <AccordionTrigger>Node Inspector</AccordionTrigger>
              <AccordionContent>Details here...</AccordionContent>
            </AccordionItem>
            <AccordionItem value="sequencer">
              <AccordionTrigger>Sequencer</AccordionTrigger>
              <AccordionContent>Scenarios here...</AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </aside>
    </div>
  );
}
```

---

### 🧱 Usage Example

**Demo Route:** `src/app/dev/scene-template/page.tsx`
```tsx
import SceneLayout from "@/templates/SceneLayout";

export default function SceneTemplateDemo() {
  return (
    <SceneLayout
      main={<div id="graph-canvas" className="h-full w-full bg-muted rounded-md" />}
    />
  );
}
```

---

### 🧰 Command Beans
Add this new dev command:
```bash
npm run dev:scene-template
```
→ Launches `/dev/scene-template` to verify structure and spacing.

---

### 🛑 Non-Interference Clause

- The `SceneLayout` and `/dev/scene-template` route are **sandbox-only**.  
- **Do not** modify or import from:
  - `/src/app/project/[id]/digital-enterprise/`
  - `/src/components/experience/`
  - `/src/scenes/`
- The new template **must not** override any layout, theme, or logic used in the production “Scenes” system.  
- When testing, run only:
  ```bash
  npm run dev:scene-template
  ```
  and confirm that **no changes appear** in the live `Digital Twin` or `Sequencer` scenes.

---

### 🧾 Acceptance Criteria
- ✅ No prototype or ghost UI components remain in repo.  
- ✅ New `SceneLayout` uses only ShadCN primitives.  
- ✅ Compiles standalone (no imports from UXShell or ExperienceShell).  
- ✅ Layout matches standard: `Left 240px` | `Center auto` | `Right 280px`.  
- ✅ Minimal Tailwind classes (`bg-background`, `border-border`, etc.).  
- ✅ Code commented and ready for reuse by subsequent pages.

