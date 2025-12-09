"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdaptiveSignalsPanel } from "@/components/learning/AdaptiveSignalsPanel";
import { useLearningSnapshot } from "@/hooks/useLearningSnapshot";

export default function ReviewEmbed({ projectId }: { projectId: string }) {
  const { snapshot } = useLearningSnapshot(projectId);
  const riskFlag = snapshot?.metrics
    ? `Adaptive engine is flagging ${Math.round(snapshot.metrics.risk * 100)}% risk ahead of publish.`
    : "Review harmonized graph deltas before publishing to Digital Enterprise.";

  return (
    <Card className="flex h-full flex-col gap-3 border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Harmonization Review</p>
        <Link href={`/project/${projectId}/harmonization-review`} className="text-xs font-semibold text-indigo-600">
          Open full view →
        </Link>
      </div>
      <p className="text-sm text-slate-700">{riskFlag}</p>
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-slate-500 text-sm p-3">
        Review embed placeholder — keeps shell responsive. Use the link above for full interaction.
      </div>
      <AdaptiveSignalsPanel snapshot={snapshot} title="Review Signals" subtitle="Publish readiness" />
    </Card>
  );
}
