"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

type ROISummary = {
  netROI: number | null;
  breakEvenMonth: number | null;
  totalCost: number;
  totalBenefit: number;
};

export default function ROISummaryEmbed({ projectId }: { projectId: string }) {
  const [roi, setRoi] = useState<ROISummary | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/roi/forecast", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setRoi({
            netROI: json?.predictions?.netROI ?? null,
            breakEvenMonth: json?.predictions?.breakEvenMonth ?? null,
            totalCost: json?.predictions?.totalCost ?? 0,
            totalBenefit: json?.predictions?.totalBenefit ?? 0,
          });
        }
      } catch {
        setRoi(null);
      }
    };
    void load();
  }, []);

  return (
    <Card className="h-full space-y-2 border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">ROI Summary</p>
        <Link href={`/project/${projectId}/experience?scene=roi`} className="text-xs font-semibold text-indigo-600">
          Open full view →
        </Link>
      </div>
      {roi ? (
        <div className="space-y-1 text-sm text-slate-700">
          <p>
            Net ROI:{" "}
            <span className={roi.netROI != null && roi.netROI > 1 ? "text-emerald-600 font-semibold" : "text-amber-600"}>
              {roi.netROI != null ? `${Math.round(roi.netROI * 100)}%` : "n/a"}
            </span>
          </p>
          <p>Break-even: {roi.breakEvenMonth != null ? `Month ${roi.breakEvenMonth}` : "n/a"}</p>
          <p>
            Totals: ${roi.totalCost.toLocaleString()} → ${roi.totalBenefit.toLocaleString()}
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-600">Loading ROI…</p>
      )}
    </Card>
  );
}
