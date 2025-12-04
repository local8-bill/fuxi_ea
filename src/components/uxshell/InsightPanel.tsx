"use client";

import { emitTelemetry } from "./telemetry";

const cards = [
  { title: "ROI tip", body: "Commerce ROI peaks in month 9; consider shifting OMS scope.", tag: "ROI" },
  { title: "Dependency alert", body: "ERP → OMS has 5 unresolved edges. Validate sequencing.", tag: "Graph" },
  { title: "Cost insight", body: "Dual-ops cost estimated at $80k for Finance domain.", tag: "Cost" },
];

export function InsightPanel() {
  const handleView = (title: string) => {
    void emitTelemetry("insight_card_viewed", { title });
  };

  return (
    <div className="space-y-3">
      <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Insights</p>
      {cards.map((c) => (
        <div
          key={c.title}
          className="uxshell-card rounded-xl bg-white p-3 cursor-pointer hover:border-slate-300 transition"
          onClick={() => handleView(c.title)}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{c.title}</p>
            <span className="text-[0.65rem] uppercase tracking-[0.15em] text-slate-500">{c.tag}</span>
          </div>
          <p className="text-sm text-slate-700 mt-1">{c.body}</p>
        </div>
      ))}
    </div>
  );
}
