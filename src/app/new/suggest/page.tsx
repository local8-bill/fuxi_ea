
"use client";

import React, { useMemo, useState } from "react";
import type { Capability, Project } from "@/types/project";
import { defaultWeights } from "@/features/capabilities/utils";

type SuggestResp = {
  capabilities: Array<Partial<Capability> & { level: "L1"|"L2"|"L3"; id?: string; parentId?: string; domain?: string; }>;
  notes?: string;
  templateSource?: string;
  error?: string;
};

function nanoid() {
  return Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,10);
}

export default function SuggestPage() {
  const [industry, setIndustry] = useState("Retail");
  const [orgSize, setOrgSize] = useState<"SMB"|"Mid"|"Enterprise">("Enterprise");
  const [scope, setScope] = useState("");
  const [goal, setGoal] = useState<"Current"|"Target">("Current");
  const [resp, setResp] = useState<SuggestResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const preview = useMemo(() => resp?.capabilities ?? [], [resp]);

  async function generate() {
    setLoading(true); setErr(""); setResp(null);
    try {
      const q = new URLSearchParams({
        industry, orgSize, goal,
        scope: scope.split(",").map(s=>s.trim()).filter(Boolean).join(",")
      });
      const r = await fetch(`/api/ai/suggest?${q.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || j.error) throw new Error(j.error || `Suggest failed (${r.status})`);
      setResp(j);
    } catch (e: any) {
      setErr(e?.message || "Failed to generate.");
    } finally {
      setLoading(false);
    }
  }

  function toProject(capabilities: SuggestResp["capabilities"]): Project {
    const caps: Capability[] = (capabilities || []).map((c) => ({
      id: c.id || nanoid(),
      name: c.name || "Untitled",
      level: c.level,
      parentId: c.parentId,
      domain: c.domain,
      description: (c as any).description,
      aliases: (c as any).aliases,
    }));
    const id = (globalThis.crypto?.randomUUID && crypto.randomUUID()) || nanoid();
    const now = new Date().toISOString();
    return {
      meta: { id, name: `${industry} Baseline`, industry, createdAt: now, updatedAt: now },
      capabilities: caps,
      weights: defaultWeights,
    };
  }

  function useBaseline() {
    if (!resp || !resp.capabilities?.length) return;
    const proj = toProject(resp.capabilities);
    localStorage.setItem(`fuxi:projects:${proj.meta.id}`, JSON.stringify(proj));
    const idxRaw = localStorage.getItem("fuxi:projects:index");
    const idx = idxRaw ? JSON.parse(idxRaw) : [];
    localStorage.setItem("fuxi:projects:index", JSON.stringify([{ ...proj.meta }, ...idx]));
    window.location.href = `/project/${proj.meta.id}/scoring`;
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">AI Suggest • Baseline Capability Model</h1>
      <p className="text-sm text-gray-600">Pick some context and let Fuxi draft a 3-level capability hierarchy. You can edit before saving.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm">
          <div className="mb-1 text-gray-700">Industry</div>
          <select value={industry} onChange={(e)=>setIndustry(e.target.value)} className="w-full rounded-md border px-3 py-2">
            <option>Retail</option>
            <option>Banking</option>
            <option>Manufacturing</option>
            <option>Healthcare</option>
            <option>Telecommunications</option>
          </select>
        </label>

        <label className="text-sm">
          <div className="mb-1 text-gray-700">Organization Size</div>
          <select value={orgSize} onChange={(e)=>setOrgSize(e.target.value as any)} className="w-full rounded-md border px-3 py-2">
            <option>SMB</option>
            <option>Mid</option>
            <option>Enterprise</option>
          </select>
        </label>

        <label className="text-sm sm:col-span-2">
          <div className="mb-1 text-gray-700">Scope Focus (comma separated)</div>
          <input value={scope} onChange={(e)=>setScope(e.target.value)} placeholder="e.g., Ecommerce, Supply Chain" className="w-full rounded-md border px-3 py-2" />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-gray-700">Goal</div>
          <select value={goal} onChange={(e)=>setGoal(e.target.value as any)} className="w-full rounded-md border px-3 py-2">
            <option>Current</option>
            <option>Target</option>
          </select>
        </label>
      </div>

      <div className="flex gap-2">
        <button onClick={generate} disabled={loading} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">
          {loading ? "Generating…" : "Generate Baseline"}
        </button>
        <a href="/new" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">Back</a>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="rounded-lg border">
        <div className="border-b p-3 text-sm font-medium">Preview</div>
        <div className="max-h-[420px] overflow-auto p-3">
          {!resp ? (
            <div className="text-sm text-gray-500">No baseline generated yet.</div>
          ) : !preview.length ? (
            <div className="text-sm text-gray-500">No capabilities returned.</div>
          ) : (
            <ul className="space-y-2">
              {preview.map((c) => (
                <li key={(c.id as string) || c.name} className="rounded border p-2">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-[11px] text-gray-600">
                    Level: {c.level}{c.domain ? ` • ${c.domain}` : ""}{c.parentId ? ` • parent: ${String(c.parentId).slice(0,6)}…` : ""}
                  </div>
                  {(c as any).description && <div className="mt-1 text-xs text-gray-700">{(c as any).description}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-3">
          <div className="text-xs text-gray-600">{resp?.notes || resp?.templateSource ? `${resp?.templateSource ?? ""} ${resp?.notes ? "— " + resp.notes : ""}` : " "}</div>
          <button
            onClick={useBaseline}
            disabled={!preview.length}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Use This Baseline
          </button>
        </div>
      </div>
    </div>
  );
}
