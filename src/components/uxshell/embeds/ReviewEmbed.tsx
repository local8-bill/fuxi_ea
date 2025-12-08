"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function ReviewEmbed({ projectId }: { projectId: string }) {
  return (
    <Card className="flex h-full flex-col gap-3 border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Harmonization Review</p>
        <Link href={`/project/${projectId}/harmonization-review`} className="text-xs font-semibold text-indigo-600">
          Open full view →
        </Link>
      </div>
      <p className="text-sm text-slate-700">Review harmonized graph deltas before publishing to Digital Enterprise.</p>
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-slate-500 text-sm p-3">
        Review embed placeholder — keeps shell responsive. Use the link above for full interaction.
      </div>
    </Card>
  );
}
