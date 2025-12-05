"use client";

import Link from "next/link";

export default function GraphEmbed({ projectId }: { projectId: string }) {
  return (
    <div className="uxshell-card rounded-2xl bg-white p-0 h-full flex flex-col overflow-hidden border border-slate-200">
      <iframe
        src={`/project/${projectId}/digital-enterprise?embed=1`}
        className="w-full h-[520px]"
        sandbox="allow-same-origin allow-scripts allow-forms"
        title="Graph"
      />
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <span className="text-xs text-slate-500">Living Map preview</span>
        <Link href={`/project/${projectId}/digital-enterprise`} className="text-indigo-600 text-sm font-semibold">
          Open full view →
        </Link>
      </div>
    </div>
  );
}
