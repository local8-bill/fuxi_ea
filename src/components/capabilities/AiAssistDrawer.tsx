"use client";

import React from "react";

type Props = {
  open: boolean;
  name?: string;
  onClose: () => void;
  onAccept: (score: number, rationale: string) => void;
};

export function AiAssistDrawer({ open, name, onClose, onAccept }: Props) {
  const [score, setScore] = React.useState(50);
  const [rationale, setRationale] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setScore(50);
      setRationale("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative h-full w-full max-w-md bg-white shadow-xl border-l border-slate-200 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">AI Assist</div>
            <div className="text-xs text-slate-500">{name || "Capability"}</div>
          </div>
          <button className="btn" onClick={onClose} aria-label="Close AI Assist">Close</button>
        </div>

        <div className="text-xs text-slate-600">
          Mock conversational assessment. Provide a quick rationale and proposed score (0-100). AI score is only applied after you accept.
        </div>

        <label className="text-xs text-slate-700">
          Proposed score: <strong>{score}</strong>
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <label className="text-xs text-slate-700 flex flex-col gap-1">
          Rationale
          <textarea
            className="rounded-md border border-slate-200 px-2 py-2 text-sm"
            rows={4}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="AI rationale or notes..."
          />
        </label>

        <div className="mt-auto flex gap-2">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onAccept(score, rationale);
              onClose();
            }}
          >
            Accept Score
          </button>
        </div>
      </div>
    </div>
  );
}
