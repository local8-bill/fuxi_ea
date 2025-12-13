import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type SceneLayoutProps = {
  left?: ReactNode;
  main: ReactNode;
  right?: ReactNode;
};

export default function SceneLayout({ left, main, right }: SceneLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-slate-100">
      <aside className="hidden w-[240px] flex-shrink-0 border-r border-slate-800 bg-slate-950/80 p-4 md:flex md:flex-col md:gap-4">
        {left ?? <DefaultLeftRail />}
      </aside>
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden p-4">
        <Card className="flex h-full flex-col border-slate-800 bg-slate-900/50 text-slate-100">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-[0.35em] text-slate-400">Graph Workspace</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">{main}</CardContent>
        </Card>
      </main>
      <aside className="hidden w-[280px] flex-shrink-0 border-l border-slate-800 bg-slate-950/80 p-4 lg:flex lg:flex-col lg:gap-4">
        {right ?? <DefaultRightRail />}
      </aside>
    </div>
  );
}

function DefaultLeftRail() {
  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Scene Navigation</p>
        <div className="mt-3 space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            Build Sequence
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            Harmonize Stack
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            Add View
          </Button>
        </div>
      </div>
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Focus Modes</p>
        <div className="mt-3 space-y-2">
          {["By Domain", "By Goal", "By Stage"].map((label) => (
            <div key={label} className="rounded-xl border border-slate-800 px-3 py-2 text-slate-200">
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DefaultRightRail() {
  return (
    <Accordion type="single" collapsible className="space-y-2">
      <AccordionItem value="inspector">
        <AccordionTrigger>Inspector</AccordionTrigger>
        <AccordionContent>
          <p className="text-xs text-slate-400">Select a node to see readiness, ROI, and telemetry.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="sequencer">
        <AccordionTrigger>Sequencer</AccordionTrigger>
        <AccordionContent>
          <p className="text-xs text-slate-400">Reorder FY phases and preview ROI impact.</p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="intent">
        <AccordionTrigger>Intent Queue</AccordionTrigger>
        <AccordionContent>
          <p className="text-xs text-slate-400">Draft /intent commands to drive scenario changes.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
