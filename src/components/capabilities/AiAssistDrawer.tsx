"use client";

import React from "react";

type Props = {
  open: boolean;
  name?: string;
  onClose: () => void;
  onAccept: (score: number, rationale: string, meta?: { last_assessed?: string; assessment_mode?: string; confidence?: number }) => void;
};

export function AiAssistDrawer({ open, name, onClose, onAccept }: Props) {
  const [score, setScore] = React.useState(50);
  const [rationale, setRationale] = React.useState("");
  const [confidence, setConfidence] = React.useState(75);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [step, setStep] = React.useState(0);

  const steps = React.useMemo(() => [
    { id: "process", prompt: "How standardized is this process today?" },
    { id: "tooling", prompt: "Which tools support it? Any gaps?" },
    { id: "integration", prompt: "How well does it integrate with upstream/downstream?" },
    { id: "risk", prompt: "What risks or blockers exist?" },
  ], []);

  const current = steps[step];

  React.useEffect(() => {
    if (open) {
      setScore(50);
      setRationale("");
      setConfidence(75);
      setAnswers({});
      setStep(0);
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
          Mock conversational assessment. Provide quick notes; AI score is only applied after you accept.
        </div>

        <div className="space-y-2 text-xs text-slate-700">
          <label className="flex flex-col gap-1">
            <span className="font-semibold">{current.prompt}</span>
            <textarea
              className="rounded-md border border-slate-200 px-2 py-2 text-sm"
              rows={2}
              value={answers[current.id] ?? ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
              placeholder="Your answer..."
            />
          </label>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <button
              className="btn"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              aria-label="Previous question"
            >
              Back
            </button>
            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <span key={idx} className={`fx-pill ${idx === step ? "active" : ""}`}>{idx + 1}</span>
              ))}
            </div>
            <button
              className="btn"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={step === steps.length - 1}
              aria-label="Next question"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
          <label className="flex flex-col gap-1">
            <span>Proposed score: <strong>{score}</strong></span>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Confidence: <strong>{confidence}%</strong></span>
            <input
              type="range"
              min={0}
              max={100}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full"
            />
          </label>
        </div>

        <label className="text-xs text-slate-700 flex flex-col gap-1">
          Rationale / summary
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
              const summary = rationale || Object.values(answers).filter(Boolean).join(" ");
              onAccept(score, summary, {
                assessment_mode: "ai_conversational",
                confidence: confidence / 100,
                last_assessed: new Date().toISOString(),
              });
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

const questions = [
  { id: "process", prompt: "How standardized is this process today?" },
  { id: "tooling", prompt: "Which tools support it? Any gaps?" },
  { id: "integration", prompt: "How well does it integrate with upstream/downstream?" },
  { id: "risk", prompt: "What risks or blockers exist?" },
];
