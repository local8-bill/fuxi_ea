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
  onBeforeApply?: () => void;
  embed?: boolean; // if true, don't render outer card/header chrome
};

export function ImportPanel({
  projectId,
  storage,
  existingL1,
  defaultOpen = false,
  onApplied,
  onBeforeApply,
  embed = false,
}: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [kind, setKind] = React.useState<"csv" | "json">("csv");
  const [text, setText] = React.useState("");
  // simple version bump to force re-render when we mutate preview
  const [, setVersion] = React.useState(0);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [parseStatus, setParseStatus] = React.useState<string | null>(null);

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
      // hook exposes `error`
    }
  };

  const onParseText = async () => {
    const src = text.trim();
    if (!src) return;
    try {
      setParseStatus(estimateParseDuration(src));
      await parseString(src, kind, existingL1);
      setOpen(true);
    } catch {
      // hook exposes `error`
    } finally {
      setParseStatus(null);
    }
  };

  const onApply = async () => {
    try {
      onBeforeApply?.();
      await applyToProject(projectId, storage);
      onApplied?.();
    } finally {
      reset(); // always clear preview state after apply
    }
  };

  const onClear = () => {
    setText("");
    reset();
  };

  const onAutoMapWithAI = async () => {
    if (!preview || aiBusy) return;
    setAiBusy(true);
    const started = Date.now();

    try {
      // Try to find a flat rows representation; fall back to roots as-is.
      const anyPreview = preview as any;
      const rows =
        anyPreview.rows ??
        anyPreview.flat ??
        anyPreview.flatRows ??
        anyPreview.roots ??
        [];

      if (!Array.isArray(rows) || rows.length === 0) {
        alert("Nothing to align yet — parse some capabilities first.");
        return;
      }

      const result = await alignViaApi(rows, existingL1);

      // Attach AI suggestions onto the preview object so the UI can render them.
      anyPreview.aiSuggestions = result.suggestions;
      anyPreview.aiIssues = result.issues ?? [];

      // Also merge AI issues into the existing issues list if present.
      if (Array.isArray(anyPreview.issues)) {
        const merged = new Set<string>(anyPreview.issues);
        for (const issue of result.issues ?? []) merged.add(issue);
        anyPreview.issues = Array.from(merged);
      } else {
        anyPreview.issues = result.issues ?? [];
      }

      // Nudge React to re-render
      setVersion((v) => v + 1);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "AI align failed");
    } finally {
      // enforce a minimum visible “thinking” time
      const elapsed = Date.now() - started;
      const min = 600; // ms
      if (elapsed < min) {
        await new Promise((r) => setTimeout(r, min - elapsed));
      }
      setAiBusy(false);
    }
  };

  const aiSuggestions = (preview as any)?.aiSuggestions as
    | { sourceName: string; action: string; targetId?: string; reason?: string }[]
    | undefined;

  const content = (
    <>
      {!embed && (
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Import (CSV / JSON) — Labs</div>
          <button className="btn" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : "Show"}
          </button>
        </div>
      )}

      {open && (
        <>
          <div className="flex flex-wrap gap-2 items-center mb-2">
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

            <button
              className="btn"
              onClick={onParseText}
              disabled={!text.trim() || busy}
            >
              Parse Text
            </button>
            {parseStatus && (
              <span className="text-xs opacity-70">{parseStatus}</span>
            )}

            <button
              className={`btn ${aiBusy ? "opacity-70 cursor-wait" : ""}`}
              onClick={onAutoMapWithAI}
              disabled={!preview || busy || aiBusy}
            >
              {aiBusy ? "Auto-mapping…" : "Auto-map with AI"}
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
              {String(error)}
            </div>
          )}

          {preview && (
            <div className="text-sm" style={{ marginTop: 8 }}>
              {aiBusy && (
                <div className="mb-1 text-slate-500">
                  AI is analyzing your capabilities…
                </div>
              )}

              <div className="mb-1">
                <strong>Preview:</strong> {preview.flatCount} rows →{" "}
                {preview.roots.length} nodes, {preview.issues.length} issues
              </div>

              {aiSuggestions && aiSuggestions.length > 0 && (
                <div className="mb-2">
                  <strong>AI Suggestions:</strong>
                  <ul className="list-disc ml-5 mt-1 space-y-0.5">
                    {aiSuggestions.map((s, idx) => (
                      <li key={`${s.sourceName}-${idx}`}>
                        <span className="font-medium">{s.sourceName}</span>{" "}
                        → <code>{s.action}</code>
                        {s.reason ? ` (${s.reason})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Object.keys((preview as any).suggestions ?? {}).length > 0 && (
                <div className="mb-1">
                  <strong>Suggestions (incoming L1 → candidates):</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.keys((preview as any).suggestions).map((k) => (
                      <span key={k} className="badge">
                        {k}
                      </span>
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
    </>
  );

  if (embed) {
    return <div className="space-y-2">{content}</div>;
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {content}
    </div>
  );
}

function estimateParseDuration(text: string): string {
  const len = text.trim().length;
  if (!len) return "Parsing text…";
  const sec = Math.min(6, Math.max(1, Math.ceil(len / 800)));
  return `Parsing text (≈ ${sec}s)…`;
}
