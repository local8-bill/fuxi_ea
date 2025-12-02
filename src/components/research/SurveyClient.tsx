"use client";

import { useEffect, useState } from "react";

type SurveyQuestion =
  | { id: string; type: "rank" | "multi-select"; prompt: string; options: string[]; allowOther?: boolean }
  | { id: string; type: "text"; prompt: string }
  | { id: string; type: "likert"; prompt: string; scale: number; followup?: string };

type Props = {
  questions: SurveyQuestion[];
};

export function SurveyClient({ questions }: Props) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (id: string, value: any) => {
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/research/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage("Saved. Thank you for your input.");
      setForm({});
    } catch (err) {
      setMessage("Could not save response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {questions.map((q) => (
        <div key={q.id} className="rounded-lg border border-slate-200 bg-white px-3 py-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">{q.type}</div>
          <div className="text-sm font-semibold text-slate-900">{q.prompt}</div>
          {renderInput(q, form[q.id], (v) => handleChange(q.id, v))}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Submit Response"}
      </button>
      {message && <div className="text-xs text-slate-600">{message}</div>}
    </form>
  );
}

function renderInput(
  q: SurveyQuestion,
  value: any,
  onChange: (v: any) => void
) {
  switch (q.type) {
    case "text":
      return (
        <textarea
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm"
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "likert":
      return (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-700">
          {[...Array(q.scale).keys()].map((i) => {
            const v = i + 1;
            return (
              <label key={v} className="inline-flex items-center gap-1">
                <input
                  type="radio"
                  name={q.id}
                  value={v}
                  checked={Number(value) === v}
                  onChange={() => onChange(v)}
                />
                {v}
              </label>
            );
          })}
        </div>
      );
    case "multi-select":
      return (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-800">
          {q.options.map((opt) => {
            const set = new Set<string>(Array.isArray(value) ? value : []);
            const checked = set.has(opt);
            return (
              <label key={opt} className="fx-pill cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={checked}
                  onChange={() => {
                    if (checked) set.delete(opt);
                    else set.add(opt);
                    onChange(Array.from(set));
                  }}
                />
                {opt}
              </label>
            );
          })}
          {q.allowOther && (
            <input
              type="text"
              placeholder="Other…"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs"
              value={(Array.isArray(value) ? value.find((v) => v?.startsWith("Other:"))?.replace("Other:", "") : "") ?? ""}
              onChange={(e) => {
                const set = new Set<string>(Array.isArray(value) ? value : []);
                const otherVal = e.target.value.trim();
                // Remove old other
                Array.from(set)
                  .filter((v) => v.startsWith("Other:"))
                  .forEach((v) => set.delete(v));
                if (otherVal) set.add(`Other:${otherVal}`);
                onChange(Array.from(set));
              }}
            />
          )}
        </div>
      );
    case "rank":
      return (
        <div className="mt-2 text-xs text-slate-700">
          <div className="text-[11px] text-slate-500">Enter a ranked list (comma-separated)</div>
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-sm"
            value={Array.isArray(value) ? value.join(", ") : value ?? ""}
            onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            placeholder="e.g., Platform direction, Org design, Vendor choices"
          />
        </div>
      );
    default:
      return null;
  }
}
