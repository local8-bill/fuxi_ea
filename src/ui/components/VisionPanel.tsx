"use client";

import React from "react";
import type { StoragePort } from "@/domain/ports/storage";
import type { Capability } from "@/domain/model/capability";

/** Rows the Vision API returns */
type VisionRow = {
  name: string;
  level: "L1" | "L2" | "L3";
  domain?: string;
  parent?: string;
};

type Props = {
  projectId: string;
  storage: StoragePort;
  defaultOpen?: boolean;
  onApplied?: () => void;   // trigger page refresh from parent if desired
};

export function VisionPanel({
  projectId,
  storage,
  defaultOpen = false,
  onApplied,
}: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<VisionRow[] | null>(null);
  const [fileName, setFileName] = React.useState<string>("");

  async function onAnalyze(file: File | null) {
    setError(null);
    setRows(null);
    if (!file) return;

    try {
      setBusy(true);
      setFileName(file.name);

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const j = await safeJson(res);
        throw new Error(j?.error || `Vision API ${res.status}`);
      }

      const data = (await res.json()) as { ok: boolean; rows: VisionRow[] };
      if (!data.ok) throw new Error("Vision API returned not ok");
      setRows(data.rows ?? []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onApply() {
    if (!rows || rows.length === 0) return;

    try {
      setBusy(true);
      setError(null);

      // 1) Load current project tree
      const current = await storage.load(projectId); // Capability[]
      const updated = integrateRows(current, rows);

      // 2) Persist
      await storage.save(projectId, updated);

      // 3) Clear local preview + notify parent
      setRows(null);
      setFileName("");
      onApplied?.();
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function onClear() {
    setRows(null);
    setError(null);
    setFileName("");
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Vision (Labs)</div>
        <button className="btn" onClick={() => setOpen(v => !v)}>
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open && (
        <>
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <label className="btn">
              <input
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.gif,.webp,.pdf"
                style={{ display: "none" }}
                onChange={(e) => onAnalyze(e.target.files?.[0] ?? null)}
              />
              Choose Image/PDF
            </label>

            <span className="text-sm" style={{ opacity: 0.7 }}>
              {busy ? "Analyzing…" : fileName || "No file selected"}
            </span>

            <div className="flex gap-2 ml-auto">
              <button
                className="btn btn-primary"
                onClick={onApply}
                disabled={!rows || rows.length === 0 || busy}
              >
                Apply to Project
              </button>
              <button className="btn" onClick={onClear} disabled={busy}>
                Clear
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm" style={{ color: "#b91c1c", marginBottom: 8 }}>
              {error}
            </div>
          )}

          {/* Preview */}
          {rows && rows.length > 0 && (
            <div className="text-sm">
              <div className="mb-2">
                <strong>Preview:</strong> {rows.length} rows extracted
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rows.map((r, i) => (
                  <div key={i} className="card">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs" style={{ opacity: 0.8 }}>
                      Level: <span className="badge">{r.level}</span>
                    </div>
                    {r.domain && (
                      <div className="text-xs" style={{ opacity: 0.8 }}>
                        Domain: <span className="badge">{r.domain}</span>
                      </div>
                    )}
                    {r.parent && (
                      <div className="text-xs" style={{ opacity: 0.8 }}>
                        Parent: <span className="badge">{r.parent}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!rows && !error && (
            <p className="text-sm" style={{ opacity: 0.7 }}>
              Pick an image or PDF of a capability map. We’ll extract L1/L2/L3
              names (and domains/parents when we can) so you can apply them to
              this project.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ----------------------------- helpers ------------------------------ */

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function integrateRows(current: Capability[], rows: VisionRow[]): Capability[] {
  const next = deepClone(current);
  const nameEq = (a = "", b = "") => a.trim().toLowerCase() === b.trim().toLowerCase();

  // quick lookup for L1 by name
  const l1ByName = new Map<string, Capability>();
  for (const cap of next) {
    l1ByName.set(cap.name.trim().toLowerCase(), cap);
  }

  // ensure children arrays exist everywhere
  const ensureChildren = (c: Capability) => (c.children ??= []);

  // id generator
  const newId = () => `cap-${Math.random().toString(36).slice(2, 10)}`;

  // find any node by name (DFS)
  function findAnyByName(name: string): Capability | null {
    const target = name.trim().toLowerCase();
    const stack = [...next];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.name.trim().toLowerCase() === target) return n;
      if (n.children?.length) stack.push(...n.children);
    }
    return null;
  }

  // upsert helpers
  function upsertL1(name: string, domain?: string): Capability {
    const key = name.trim().toLowerCase();
    let node = l1ByName.get(key);
    if (!node) {
      node = { id: newId(), name, level: "L1" as any, domain: domain || "Unassigned", children: [] };
      next.push(node);
      l1ByName.set(key, node);
    } else if (domain && !node.domain) {
      node.domain = domain;
    }
    return node;
  }

  function upsertChild(parent: Capability, name: string, level: "L2" | "L3") {
    ensureChildren(parent);
    const exists = parent.children!.find(c => nameEq(c.name, name));
    if (exists) return exists;
    const child: Capability = { id: newId(), name, level: level as any, children: [] };
    parent.children!.push(child);
    return child;
  }

  // Apply all rows in an order that’s stable for parenting:
  // L1s first, then L2s, then L3s
  const l1s = rows.filter(r => r.level === "L1");
  const l2s = rows.filter(r => r.level === "L2");
  const l3s = rows.filter(r => r.level === "L3");

  // L1
  for (const r of l1s) upsertL1(r.name, r.domain);

  // L2
  for (const r of l2s) {
    const parent =
      (r.parent && findAnyByName(r.parent)) ||
      (r.domain && pickL1ByDomain(next, r.domain)) ||
      null;
    const host = parent && parent.level === "L1" ? parent : upsertL1(r.parent || "Unassigned", r.domain);
    upsertChild(host, r.name, "L2");
  }

  // L3
  for (const r of l3s) {
    const parent = r.parent && findAnyByName(r.parent);
    if (parent) {
      upsertChild(parent, r.name, "L3");
    } else {
      // fallback: attach under a domain head or create Unassigned
      const host =
        (r.domain && pickL1ByDomain(next, r.domain)) ||
        upsertL1("Unassigned", r.domain);
      const l2 = upsertChild(host, r.parent || "Misc", "L2");
      upsertChild(l2, r.name, "L3");
    }
  }

  return next;
}

function pickL1ByDomain(roots: Capability[], domain: string): Capability | null {
  const key = domain.trim().toLowerCase();
  for (const r of roots) {
    if ((r.domain || "").trim().toLowerCase() === key && (r.level as any) === "L1") {
      return r;
    }
  }
  return null;
}

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}
