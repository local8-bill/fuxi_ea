"use client";
import React from "react";
import type { StoragePort } from "@/domain/ports/storage";
import { useMapIntelligence } from "@/controllers/useMapIntelligence";
import { alignViaApi } from "@/adapters/reasoning/client";

type Props = {
  projectId: string;
  storage: StoragePort;
  existingL1: string[];
  defaultOpen?: boolean;
  onApplied?: () => void; // refresh callback (e.g., reload grid)
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
    try {
      const ext = f.name.toLowerCase().endsWith(".json") ? "json" : "csv";
      setKind(ext as any);
      const t = await f.text();
      setText(t);
      await parseFile(f, existingL1);
      setOpen(true);
    } catch {
      /* hook sets error */
    }
  };

  const onParseText = async () => {
    const src = text.trim();
    if (!src) return;
    try {
      await parseString(src, kind, existingL1);
      setOpen(true);
    } catch { /* hook sets error */ }
  };

  const onAutoMap = async () => {
    if (!preview) return;
    try {
      const result = await alignViaApi(preview.roots, existingL1);
      (preview as any).suggestions = result.suggestions;
      (preview as any).issues = [...new Set([...(preview.issues || []), ...result.issues])];
      // force a re-render
      setText(t => t);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "AI align failed");
    }
  };

  const onApply = async () => {
    try {
      await applyToProject(projectId, storage);
      onApplied?.();
    } finally {
      reset();
    }
  };

  const onClear = () => {
    setText("");
    reset();
  };

  const suggestions = (preview as any)?.suggestions as
    | { sourceName: string; action: "merge" | "attach" | "new"; targetId?: string; reason: string }[]
    | undefined;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Import (CSV / JSON) — Labs</div>
        <button className="btn" onClick={() => setOpen(v => !v)}>{open ? "Hide" : "Show"}</button>
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

            <select className="select" value={kind} onChange={(e) => setKind(e.target.value as any)}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>

            <button className="btn" onClick={onParseText} disabled={!text.trim()}>
              Parse Text
            </button>

            <button className="btn" onClick={onAutoMap} disabled={!preview || busy}>
              Auto-map with AI
            </button>

            <button className="btn btn-primary" onClick={onApply} disabled={!preview || busy}>
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
              {String(error)}
            </div>
          )}

          {preview && (
            <div className="text-sm" style={{ marginTop: 8 }}>
              <div className="mb-1">
                <strong>Preview:</strong> {preview.flatCount} rows → {preview.roots.length} nodes, {preview.issues.length} issues
              </div>

              {suggestions && suggestions.length > 0 && (
                <div className="mt-3">
                  <strong>AI Suggestions</strong>
                  <div className="text-xs opacity-70 mb-2">Nothing is applied until you click “Apply to Project”.</div>
                  <div className="overflow-auto" style={{ maxHeight: 220 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "6px" }}>Incoming</th>
                          <th style={{ textAlign: "left", padding: "6px" }}>Action</th>
                          <th style={{ textAlign: "left", padding: "6px" }}>Target</th>
                          <th style={{ textAlign: "left", padding: "6px" }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suggestions.map((s, i) => (
                          <tr key={i} className="border-t">
                            <td style={{ padding: "6px" }}>{s.sourceName}</td>
                            <td style={{ padding: "6px" }}>
                              <span className="badge">{s.action.toUpperCase()}</span>
                            </td>
                            <td style={{ padding: "6px" }}>{s.targetId || "-"}</td>
                            <td style={{ padding: "6px" }}>{s.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(preview.issues?.length ?? 0) > 0 && (
                <div className="mt-2">
                  <strong>Issues:</strong>
                  <ul className="list-disc ml-6">
                    {preview.issues.map((m: string, i: number) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
