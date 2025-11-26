"use client";

import React from "react";
import type { SimulationEvent } from "@/types/livingMap";

type EventLogPanelProps = {
  events: SimulationEvent[];
  filter?: (e: SimulationEvent) => boolean;
};

export function EventLogPanel({ events, filter }: EventLogPanelProps) {
  const items = filter ? events.filter(filter) : events;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Simulation Events</p>
          <p className="text-[11px] text-slate-500">Recent changes across domains.</p>
        </div>
      </div>
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {items.map((evt) => (
          <div
            key={evt.id}
            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{evt.title}</p>
                <p className="text-xs text-slate-600">{evt.detail}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {evt.timestamp} · {evt.domain ?? "Global"}
                </p>
              </div>
              <span className="text-[11px] text-slate-500 uppercase">{evt.type}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-slate-500">No events in this view.</p>
        )}
      </div>
    </div>
  );
}
