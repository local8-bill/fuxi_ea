"use client";

import React, { useState } from "react";

/** ---------- Local types (no external utils) ---------- */
type OCRBox = { text: string; x: number; y: number; w: number; h: number };
type OCRDoc = { boxes: OCRBox[] };

type Scores = {
  maturity: number;
  techFit: number;
  strategicAlignment: number;
  peopleReadiness: number;
  opportunity: number;
};

type Capability = {
  id: string;
  name: string;
  domain?: string;
  level: "L1" | "L2" | "L3";
  parentId?: string;
  scores?: Scores;
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewCaps, setPreviewCaps] = useState<Capability[] | null>(null);

  async function handleParse() {
    if (!file) return;
    setBusy(true);
    setError("");
    setPreviewCaps(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/vision", { method: "POST", body });
      if (!res.ok) throw new Error(`Parser error: ${res.status}`);
      const doc: OCRDoc = await res.json();
      const caps = normalizeToCapabilities(doc);
      setPreviewCaps(caps);
    } catch (e: any) {
      setError(e?.message || "Failed to parse image.");
    } finally {
      setBusy(false);
    }
  }

  function handleSave() {
    if (!previewCaps) return;
    try {
      localStorage.setItem("fuxi:dataset:v1", JSON.stringify(previewCaps));
      alert("Imported capability map saved. Reloading…");
      window.location.href = "/";
    } catch {
      setError("Could not save dataset to localStorage.");
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold">Import Capability Map</h1>
      <p className="mt-1 text-sm text-gray-600">
        Upload an image of a capability map. We’ll parse it into a draft list you can save.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              setPreviewCaps(null);
              setError("");
              if (f) setImgUrl(URL.createObjectURL(f));
            }}
          />
          <button
            disabled={!file || busy}
            onClick={handleParse}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? "Parsing…" : "Parse Image"}
          </button>

          {error && <div className="text-sm text-red-600">{error}</div>}

          {imgUrl && (
            <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-md border bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgUrl} alt="uploaded" className="h-full w-full object-contain" />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Preview (detected capabilities)</div>
          <div className="h-[420px] overflow-auto rounded-md border p-3 bg-white">
            {!previewCaps ? (
              <div className="text-sm text-gray-500">Nothing parsed yet.</div>
            ) : previewCaps.length === 0 ? (
              <div className="text-sm text-gray-500">No capabilities detected.</div>
            ) : (
              <ul className="space-y-2">
                {previewCaps.map((c) => (
                  <li key={c.id} className="rounded border p-2">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-[11px] text-gray-600">
                      Level: {c.level}
                      {c.domain ? ` • ${c.domain}` : ""}
                      {c.parentId ? ` • parent ${c.parentId}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2">
            <button
              disabled={!previewCaps || previewCaps.length === 0}
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save as current dataset
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Cancel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ---------- super-naive normalizer (stub) ---------- */
function normalizeToCapabilities(doc: OCRDoc): Capability[] {
  const boxes = doc.boxes.slice().sort((a, b) => a.y - b.y || a.x - b.x);
  const cleaned = boxes.filter((b) => b.text && b.text.trim().length > 2);

  // group approximate rows
  const rows: OCRBox[][] = [];
  const yTol = 24;
  for (const b of cleaned) {
    const row = rows.find((r) => Math.abs(r[0].y - b.y) < yTol);
    if (row) row.push(b);
    else rows.push([b]);
  }
  rows.forEach((r) => r.sort((a, b) => a.x - b.x));

  const caps: Capability[] = [];
  let currentL1Id: string | null = null;
  let l1 = 0,
    l2 = 0;

  for (const row of rows) {
    const t = row[0].text.trim();
    const isL1 = /^[A-Z][A-Z\s&]+$/.test(t) && t.length >= 10;

    if (isL1) {
      currentL1Id = `L1_${++l1}`;
      caps.push({ id: currentL1Id, name: titleCase(t), level: "L1" });
      continue;
    }
    if (!currentL1Id) {
      currentL1Id = `L1_${++l1}`;
      caps.push({ id: currentL1Id, name: "General", level: "L1" });
    }

    for (const b of row) {
      const id = `L2_${++l2}`;
      const domain = caps.find((c) => c.id === currentL1Id)?.name;
      caps.push({
        id,
        name: titleCase(b.text.trim()),
        level: "L2",
        domain,
        parentId: currentL1Id,
        scores: { maturity: 3, techFit: 3, strategicAlignment: 3, peopleReadiness: 3, opportunity: 3 },
      });
    }
  }
  return caps;
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}