"use client";

import clsx from "clsx";

export type GraphSequencerItem = {
  id: string;
  label: string;
  phase: string;
  region: string;
  system?: string;
  dependencies?: string[];
  cost: number;
  impact: number;
  systemsTouchedCount?: number;
  integrationsTouchedCount?: number;
  conflictCount?: number;
  timeWindowLabel?: string;
  regions?: string[];
};

interface GraphSequencerPanelProps {
  sequence: GraphSequencerItem[];
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
  activePhase: string;
  onSimulate: (phase: string) => void;
  onTogglePlayback?: () => void;
  isPlaying?: boolean;
  highlightSequenceId?: string | null;
  onItemMount?: (id: string, element: HTMLLIElement | null) => void;
}

export function GraphSequencerPanel({
  sequence,
  onDragStart,
  onDragOver,
  onDragEnd,
  activePhase,
  onSimulate,
  onTogglePlayback,
  isPlaying,
  highlightSequenceId,
  onItemMount,
}: GraphSequencerPanelProps) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/95 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Stage jump list</p>
          <p className="text-sm text-neutral-600">Drag to reorder modernization waves and jump across the map.</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white"
          onClick={() => onSimulate(activePhase)}
        >
          Simulate
        </button>
      </div>
      {onTogglePlayback ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
          <button
            type="button"
            onClick={onTogglePlayback}
            className="rounded-full border border-neutral-300 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <span className="text-[0.7rem] text-neutral-500">Sequencer playback</span>
        </div>
      ) : null}
      <ul className="mt-3 space-y-2 text-sm text-neutral-700">
        {sequence.map((step, index) => (
          <li
            key={step.id}
            draggable
            ref={(el) => onItemMount?.(step.id, el)}
            onDragStart={() => onDragStart(step.id)}
            onDragOver={(event) => {
              event.preventDefault();
              onDragOver(step.id);
            }}
            onDragEnd={onDragEnd}
            className={clsx(
              "rounded-2xl border px-3 py-2 shadow-sm transition-shadow",
              step.phase === activePhase ? "border-indigo-500 bg-indigo-50" : "border-neutral-200 bg-white",
              highlightSequenceId === step.id ? "ring-2 ring-indigo-400 shadow-lg animate-pulse" : null,
            )}
          >
            <p className="font-semibold">
              #{index + 1} · {step.label}
            </p>
            <p className="text-xs text-neutral-500">
              {step.phase.toUpperCase()} · Cost ${step.cost.toFixed(1)}M · Impact {(step.impact * 100).toFixed(0)}%
            </p>
            {step.timeWindowLabel ? <p className="text-[0.65rem] text-neutral-500">{step.timeWindowLabel}</p> : null}
            {typeof step.systemsTouchedCount === "number" || typeof step.integrationsTouchedCount === "number" || typeof step.conflictCount === "number" ? (
              <div className="mt-1 flex flex-wrap gap-2 text-[0.65rem] text-neutral-600">
                {typeof step.systemsTouchedCount === "number" ? <span>{step.systemsTouchedCount} systems</span> : null}
                {typeof step.integrationsTouchedCount === "number" ? <span>{step.integrationsTouchedCount} integrations</span> : null}
                {step.conflictCount ? <span className="text-amber-600">{step.conflictCount} conflicts</span> : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface GraphEventConsoleProps {
  events: string[];
  emptyMessage?: string;
}

export function GraphEventConsole({ events, emptyMessage = "Interact with the graph to see learning events." }: GraphEventConsoleProps) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-neutral-50/95 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">Learning Console</p>
      {events.length ? (
        <ul className="mt-2 space-y-1 text-xs text-neutral-600">
          {events.map((event, idx) => (
            <li key={`${event}-${idx}`}>{event}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">{emptyMessage}</p>
      )}
    </section>
  );
}
