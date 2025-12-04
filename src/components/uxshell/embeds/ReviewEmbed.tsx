"use client";

import Link from "next/link";

export default function ReviewEmbed({ projectId }: { projectId: string }) {
  return (
    <div className="uxshell-card rounded-2xl bg-white p-4 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Harmonization Review</p>
        <Link href={`/project/${projectId}/harmonization-review`} className="text-indigo-600 text-sm font-semibold">
          Open full view →
        </Link>
      </div>
      <p className="text-sm text-slate-700">Review harmonized graph deltas before publishing to Digital Enterprise.</p>
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-slate-500 text-sm p-3">
        Review embed placeholder — keeps shell responsive. Use the link above for full interaction.
      </div>
    </div>
  );
}
