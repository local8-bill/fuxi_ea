"use client";
import React from "react";

export type VisionSuggestion = {
  name: string;
  domain: string;
  confidence: number;
};

type Props = {
  onAccept: (s: VisionSuggestion) => void;
  bare?: boolean;
};

export function VisionPanel({ onAccept, bare = false }: Props) {
  const [note, setNote] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [suggestion, setSuggestion] = React.useState<VisionSuggestion | null>(null);

  const onChooseFile = async (f: File | null) => {
    setError(null);
    setSuggestion(null);
    setFile(f);
  };

  const onAnalyze = async () => {
    setError(null);
    setSuggestion(null);
    setBusy(true);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      if (note.trim()) fd.append("note", note.trim());

      const res = await fetch("/api/vision/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Vision analyze failed");

      // Basic heuristic → pick first L1 if present, else first row
      const rows = data.rows as Array<{ name: string; level?: string; domain?: string }>;
      const pick =
        rows.find((r) => (r.level || "").toUpperCase() === "L1") ??
        rows[0] ??
        null;

      if (!pick) throw new Error("No rows returned");

      const s: VisionSuggestion = {
        name: pick.name || "New Capability",
        domain: pick.domain || inferDomain(note),
        confidence: 0.6,
      };
      setSuggestion(s);
    } catch (e: any) {
      setError(e?.message || "Analyze failed");
    } finally {
      setBusy(false);
    }
  };

  const content = (
    <>
      <div className="grid gap-2 mb-2">
        <input
          className="input"
          placeholder="Optional note (helps classify domain)…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <label className="btn" style={{ width: "fit-content" }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
          />
          {file ? `Selected: ${file.name}` : "Choose Image"}
        </label>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={onAnalyze} disabled={busy}>
          Analyze
        </button>
        {suggestion && (
          <button
            className="btn"
            onClick={() => onAccept(suggestion)}
            disabled={busy}
          >
            Add as L1
          </button>
        )}
      </div>

      {error && <div className="text-sm" style={{ color: "#b91c1c", marginTop: 8 }}>{error}</div>}

      {suggestion && (
        <div className="text-sm" style={{ marginTop: 8 }}>
          <div><strong>Proposed:</strong> {suggestion.name}</div>
          <div><strong>Domain:</strong> {suggestion.domain} <span className="opacity-70">({Math.round(suggestion.confidence * 100)}%)</span></div>
        </div>
      )}
    </>
  );

  if (bare) return content;

  return (
    <div className="card">
      <div className="font-semibold mb-2">Vision (Labs)</div>
      {content}
    </div>
  );
}

function inferDomain(note: string): string {
  const s = (note || "").toLowerCase();
  if (/(supply|inventory|warehouse|logistics|fulfillment)/.test(s)) return "Supply Chain";
  if (/(commerce|checkout|pdp|cart|catalog|merch|omni)/.test(s)) return "Digital Commerce";
  if (/(finance|budget|accounting|cost)/.test(s)) return "Finance";
  if (/(data|analytics|bi|insights|ml|ai)/.test(s)) return "Data & Analytics";
  if (/(strategy|planning|roadmap|portfolio)/.test(s)) return "Strategy";
  return "Unassigned";
}
