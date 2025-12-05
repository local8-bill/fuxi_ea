"use client";

import Link from "next/link";

export default function GraphEmbed({ projectId }: { projectId: string }) {
  return (
    <div className="uxshell-card rounded-2xl bg-white p-0 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <p className="text-sm font-semibold text-slate-900">Living Map (Graph)</p>
        <Link href={`/project/${projectId}/digital-enterprise`} className="text-indigo-600 text-sm font-semibold">
          Open full view →
        </Link>
      </div>
      <div className="h-[420px] border-t border-slate-100">
        <iframe
          src={`/project/${projectId}/digital-enterprise?embed=1`}
          className="w-full h-full"
          sandbox="allow-same-origin allow-scripts allow-forms"
          title="Graph"
        />
      </div>
    </div>
  );
}
