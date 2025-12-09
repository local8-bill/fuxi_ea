"use client";

import { Card } from "@/components/ui/Card";
import { useClassificationMix, type ClassificationDefinition } from "@/hooks/useClassificationMix";

type Props = {
  projectId: string;
};

export function ROIClassificationBreakdown({ projectId }: Props) {
  const { data, loading } = useClassificationMix(projectId);

  if (loading) {
    return (
      <Card className="p-4 text-sm text-slate-600">
        Loading classification mix…
      </Card>
    );
  }

  if (!data?.mix) {
    return null;
  }

  const ordered = orderDefinitions(data.definitions, data.mix);

  return (
    <Card className="space-y-3 border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">ROI Signals</p>
          <p className="text-sm font-semibold text-slate-900">Segmentation by platform classification</p>
        </div>
      </div>
      <div className="space-y-2">
        {ordered.map((entry) => (
          <div key={entry.name}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{entry.name}</span>
              <span>{Math.round(entry.weight * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-slate-900 transition-all"
                style={{ width: `${Math.round(entry.weight * 100)}%` }}
              />
            </div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-400">{entry.roi_focus}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function orderDefinitions(defs: ClassificationDefinition[], mix: Record<string, number>) {
  const map = new Map<string, ClassificationDefinition>();
  defs.forEach((def) => map.set(def.name, def));
  return Object.entries(mix)
    .map(([name, weight]) => ({
      name,
      weight,
      roi_focus: map.get(name)?.roi_focus ?? "",
    }))
    .sort((a, b) => b.weight - a.weight);
}
