"use client";

import React from "react";

type Step = {
  key: string;
  label: string;
  status?: "active" | "complete";
};

type Props = {
  projectId: string;
};

const steps: Step[] = [
  { key: "intake", label: "Intake" },
  { key: "tech-stack", label: "Tech Stack" },
  { key: "connection-confirmation", label: "Connections" },
  { key: "digital-enterprise", label: "Digital Enterprise" },
];

export function ProjectFlowBar({ projectId }: Props) {
  const [state, setState] = React.useState<Record<string, any> | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/state?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setState(json?.state ?? null);
        }
      } catch {
        // ignore
      }
    };
    void load();
  }, [projectId]);

  const enriched = steps.map((s) => ({
    ...s,
    status: state?.steps?.[s.key]?.status ?? "active",
  }));
  const completed = enriched.filter((s) => s.status === "complete").length;
  const progress = Math.round((completed / enriched.length) * 100);
  const createdAtMs = state?.createdAt ? new Date(state.createdAt).getTime() : null;
  const [elapsedMinutes, setElapsedMinutes] = React.useState(() => 0);

  React.useEffect(() => {
    if (typeof window === "undefined" || !createdAtMs) {
      setElapsedMinutes(0);
      return;
    }
    const updateElapsed = () => {
      const diff = Math.max(0, Date.now() - createdAtMs);
      setElapsedMinutes(Math.round(diff / 60000));
    };
    updateElapsed();
    const id = window.setInterval(updateElapsed, 60000);
    return () => window.clearInterval(id);
  }, [createdAtMs]);

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {enriched.map((s, idx) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold " +
                  (s.status === "complete" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700")
                }
              >
                {s.label}
              </div>
              {idx < enriched.length - 1 && <div className="h-px w-6 bg-slate-200" />}
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-600">
          {progress}% · {elapsedMinutes}m elapsed
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-slate-900" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
