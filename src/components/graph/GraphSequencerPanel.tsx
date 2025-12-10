"use client";

export type GraphSequencerItem = {
  id: string;
  label: string;
  phase: string;
  region: string;
  system?: string;
  dependencies?: string[];
  cost: number;
  impact: number;
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
}: GraphSequencerPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Sequencer</p>
          <p className="text-sm text-slate-600">Drag to reorder modernization phases.</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
          onClick={() => onSimulate(activePhase)}
        >
          Simulate
        </button>
      </div>
      {onTogglePlayback ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <button
            type="button"
            onClick={onTogglePlayback}
            className="rounded-full border border-slate-300 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <span className="text-[0.7rem] text-slate-500">Sequencer playback</span>
        </div>
      ) : null}
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {sequence.map((step, index) => (
          <li
            key={step.id}
            draggable
            onDragStart={() => onDragStart(step.id)}
            onDragOver={(event) => {
              event.preventDefault();
              onDragOver(step.id);
            }}
            onDragEnd={onDragEnd}
            className={`rounded-2xl border px-3 py-2 shadow-sm ${
              step.phase === activePhase ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white"
            }`}
          >
            <p className="font-semibold">
              #{index + 1} · {step.label}
            </p>
            <p className="text-xs text-slate-500">
              {step.phase.toUpperCase()} · {step.region} · Cost ${step.cost.toFixed(1)}M · Impact {(step.impact * 100).toFixed(0)}%
            </p>
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
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Learning Console</p>
      {events.length ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {events.map((event, idx) => (
            <li key={`${event}-${idx}`}>{event}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-500">{emptyMessage}</p>
      )}
    </section>
  );
}
