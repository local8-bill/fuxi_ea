import clsx from "clsx";
import type { GraphDataSource } from "./constants";

interface SequencePromptOverlayProps {
  open: boolean;
  value: string;
  error: string | null;
  submitting: boolean;
  aleConnected: boolean;
  graphSource: GraphDataSource;
  graphSnapshotLabel: string | null;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function describeGraphSource(source: GraphDataSource, snapshotLabel: string | null) {
  if (source === "snapshot") return snapshotLabel ?? "Snapshot";
  if (source === "live") return "Live (API)";
  return "Not loaded";
}

export function SequencePromptOverlay({
  open,
  value,
  error,
  submitting,
  aleConnected,
  graphSource,
  graphSnapshotLabel,
  onChange,
  onClose,
  onSubmit,
}: SequencePromptOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-8">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">Build a Sequence</p>
            <h3 className="text-xl font-semibold text-slate-900">Describe the modernization goal</h3>
          </div>
          <button type="button" className="text-sm text-slate-500 hover:text-slate-900" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">We&apos;ll analyze the harmonized graph + ALE context and open the Sequencer with a generated plan.</p>
        <textarea
          className="mt-4 h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Replace OMS globally by 2029..."
          disabled={submitting}
        />
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <span>ALE context: {aleConnected ? "Connected" : "Initializing..."}</span>
          <span>Graph source: {describeGraphSource(graphSource, graphSnapshotLabel)}</span>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={clsx(
              "rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60",
            )}
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "Generating..." : "Generate Sequence"}
          </button>
        </div>
      </div>
    </div>
  );
}
