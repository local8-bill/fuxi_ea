"use client";
import React from "react";
import type { StoragePort } from "@/domain/ports/storage";
import { useMapIntelligence } from "@/controllers/useMapIntelligence";

type Props = {
  projectId: string;
  storage: StoragePort;
  existingL1: string[];
  defaultOpen?: boolean;
  onApplied?: () => void; // ← callback to refresh the page
};

export function ImportPanel({
  projectId,
  storage,
  existingL1,
  defaultOpen = false,
  onApplied,
}: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [kind, setKind] = React.useState<"csv" | "json">("csv");
  const [text, setText] = React.useState("");
  const {
    busy,
    error,
    preview,
    parseString,
    parseFile,
    applyToProject,
    reset,
  } = useMapIntelligence();

const onChooseFile = async (f: File | null) => {
  if (!f) return;
  const ext = f.name.toLowerCase().endsWith(".json") ? "json" : "csv";
  setKind(ext as any);
  const t = await f.text();
  setText(t);
  await parseFile(f, existingL1);  // already guards inside
  setOpen(true);
};

  const onParseText = async () => {
    const src = text.trim(); 
    if (!src) return;
    await parseString(text, kind, existingL1);
    setOpen(true);
  };

  const onApply = async () => {
    await applyToProject(projectId, storage);
    onApplied?.();   // ← trigger page reload
    reset();         // ← clear preview state
  };

  const onClear = () => {
    setText("");
    reset();
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Import (CSV / JSON) — Labs</div>
        <button className="btn" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          <div className="flex gap-2 items-center mb-2">
            <label className="btn">
              <input
                type="file"
                accept=".csv,.json"
                style={{ display: "none" }}
                onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
              />
              Choose File
            </label>

            <select
              className="select"
              value={kind}
              onChange={(e) => setKind(e.target.value as any)}
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>

            <button className="btn" onClick={onParseText} disabled={!text.trim() || busy}>
              Parse Text
            </button>

            <button
              className="btn btn-primary"
              onClick={onApply}
              disabled={!preview || busy}
            >
              Apply to Project
            </button>

            <button className="btn" onClick={onClear} disabled={busy}>
              Clear
            </button>
          </div>

          <textarea
            className="input"
            style={{ width: "100%", height: 140 }}
            placeholder={kind === "csv" ? "Paste CSV…" : "Paste JSON…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {error && (
            <div className="text-sm" style={{ color: "#b91c1c", marginTop: 8 }}>
              {error}
            </div>
          )}

          {preview && (
            <div className="text-sm" style={{ marginTop: 8 }}>
              <div className="mb-1">
                <strong>Preview:</strong> {preview.flatCount} rows →{" "}
                {preview.roots.length} nodes, {preview.issues.length} issues
              </div>

              {Object.keys(preview.suggestions).length > 0 && (
                <div className="mb-1">
                  <strong>Suggestions (incoming L1 → candidates):</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.keys(preview.suggestions).map((k) => (
                      <span key={k} className="badge">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-1">
                <strong>Root L1s in preview:</strong>{" "}
                {preview.roots.map((r) => r.name).join(", ")}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}