"use client";
import React from "react";
import type { StoragePort } from "@/domain/ports/storage";

type Props = {
  projectId: string;
  storage: StoragePort;
  defaultOpen?: boolean;
  onApplied?: () => void; // refresh after apply
};

type Suggestion = {
  name: string;
  domain: string;
  confidence: number; // 0..1
};

export function VisionPanel({
  projectId,
  storage,
  defaultOpen = false,
  onApplied,
}: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [imageDataUrl, setImageDataUrl] = React.useState<string | null>(null);
  const [note, setNote] = React.useState("");
  const [suggestion, setSuggestion] = React.useState<Suggestion | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onChooseImage = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setSuggestion(null);
    setImageDataUrl(await fileToDataUrl(file));
  };

  const onAnalyze = async () => {
    setBusy(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: imageDataUrl ?? undefined,
          note: note || undefined,
        }),
      });
      if (!res.ok) throw new Error(`Vision API ${res.status}`);
      const json = await res.json();
      if (!json.ok || !json.suggestion) throw new Error("No suggestion returned");
      setSuggestion(json.suggestion as Suggestion);
    } catch (e: any) {
      setError(e?.message ?? "Vision analyze failed");
    } finally {
      setBusy(false);
    }
  };

  const onApply = async () => {
    if (!suggestion) return;
    setBusy(true);
    setError(null);
    try {
      const caps = await storage.load(projectId);
      caps.push({
        id: `cap-${Math.random().toString(36).slice(2, 10)}`,
        name: suggestion.name,
        level: "L1" as any,
        domain: suggestion.domain || "Unassigned",
        children: [],
      });
      await storage.save(projectId, caps);
      onApplied?.();
      // clear form
      setSuggestion(null);
      setImageDataUrl(null);
      setNote("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to apply suggestion");
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    setImageDataUrl(null);
    setNote("");
    setSuggestion(null);
    setError(null);
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Vision (Image/PDF → Suggest L1) — Labs</div>
        <button className="btn" onClick={() => setOpen(v => !v)}>
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <label className="btn">
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.pdf"
                style={{ display: "none" }}
                onChange={(e) => onChooseImage(e.target.files?.[0] ?? null)}
              />
              Choose Image/PDF
            </label>

            <button className="btn" onClick={onAnalyze} disabled={busy}>
              Analyze
            </button>

            <button className="btn" onClick={onClear} disabled={busy}>
              Clear
            </button>

            {suggestion && (
              <button className="btn btn-primary" onClick={onApply} disabled={busy}>
                Apply to Project
              </button>
            )}
          </div>

          {imageDataUrl && (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt="preview"
                style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
            </div>
          )}

          <textarea
            className="input"
            style={{ width: "100%", height: 100 }}
            placeholder="Optional note to guide the suggestion (e.g., 'Warehouse replenishment flow for returns')."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {error && (
            <div className="text-sm" style={{ color: "#b91c1c", marginTop: 8 }}>
              {error}
            </div>
          )}

          {suggestion && (
            <div className="text-sm" style={{ marginTop: 10 }}>
              <div className="mb-1"><strong>Suggestion:</strong> {suggestion.name}</div>
              <div className="mb-1"><strong>Domain:</strong> {suggestion.domain}</div>
              <div className="mb-1">
                <strong>Confidence:</strong> {(suggestion.confidence * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}