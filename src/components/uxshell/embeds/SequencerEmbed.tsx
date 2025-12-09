"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdaptiveSignalsPanel } from "@/components/learning/AdaptiveSignalsPanel";
import { useLearningSnapshot } from "@/hooks/useLearningSnapshot";

export default function SequencerEmbed({ projectId }: { projectId: string }) {
  const { snapshot } = useLearningSnapshot(projectId);
  const cadenceDescription = snapshot?.metrics
    ? `Current cadence is operating at ${Math.round(snapshot.metrics.velocity * 100)}% of plan with ${
        Math.round(snapshot.metrics.confidence * 100)
      }% confidence in the next wave.`
    : null;

  return (
    <Card className="flex h-full flex-col gap-3 border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Transformation Sequencer</p>
        <Link href={`/project/${projectId}/transformation-dialogue`} className="text-xs font-semibold text-indigo-600">
          Open full view →
        </Link>
      </div>
      <p className="text-sm text-slate-700">
        Build multi-stage roadmaps and validate stage costs.
        {cadenceDescription ? <span className="mt-1 block text-[12px] text-slate-500">{cadenceDescription}</span> : null}
      </p>
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-slate-500 text-sm p-3">
        Sequencer embed placeholder — keeps shell responsive. Use the link above for full interaction.
      </div>
      <AdaptiveSignalsPanel snapshot={snapshot} title="Sequencer Signals" subtitle="Cadence · Guidance" />
    </Card>
  );
}
