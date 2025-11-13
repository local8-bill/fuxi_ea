// src/controllers/useMapIntelligence.ts
"use client";

import * as React from "react";
import type { Capability } from "@/domain/model/capability";
import type { StoragePort } from "@/domain/ports/storage";
import { alignViaApi } from "@/adapters/reasoning/client";
import type { ReasoningAlignResult, ReasoningAlignRow } from "@/domain/ports/reasoning";
import { localHeuristicAi, type Suggestion } from "@/domain/services/aiMapping";

type ImportKind = "csv" | "json";
type Row = {
  id?: string;
  name: string;
  level?: string;     // "L1" | "L2" | "L3"
  domain?: string;
  parent?: string;    // parent name for L2/L3
};

export type ImportPreview = {
  roots: Capability[];
  flatCount: number;
  issues: string[];
  suggestions: Record<string, Suggestion[]>;
  aiResult?: ReasoningAlignResult;
};

const LEVELS = new Set(["l1", "l2", "l3"]);
function toLevel(s?: string): "L1" | "L2" | "L3" | undefined {
  if (!s) return undefined;
  const k = s.toLowerCase().trim();
  if (LEVELS.has(k)) return k.toUpperCase() as any;
  return undefined;
}

/* ---------------- CSV ---------------- */

function parseCsv(input: string): Row[] {
  const text = (input ?? "").replace(/\r\n/g, "\n");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const r: any = {};
    header.forEach((h, idx) => (r[h] = (cols[idx] ?? "").trim()));
    rows.push({
      id: r["id"] || undefined,
      name: r["name"] || r["capability"] || r["cap"] || "",
      level: r["level"] || r["lvl"] || r["l"],
      domain: r["domain"] || r["area"] || r["group"] || undefined,
      parent: r["parent"] || r["parent name"] || r["parent_name"] || undefined,
    });
  }

  return rows.filter((r) => r.name);
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/* ---------------- JSON ---------------- */

function parseJson(input: string): Row[] {
  // Trim, strip BOMs, guard empties
  const s = (input ?? "").replace(/^\uFEFF/, "").trim();
  if (!s) {
    throw new Error("No JSON provided. Paste a JSON array of rows or a single tree object.");
  }

  let data: any;
  try {
    data = JSON.parse(s);
  } catch (e: any) {
    // Surface a helpful message while keeping the original error detail
    throw new Error(`Invalid JSON: ${e?.message ?? "parse failed"}`);
  }

  // Accept either a flat array of rows or a single tree object {name, level, children:[]}
  if (Array.isArray(data)) {
    return data
      .map((x: any) => ({
        id: x?.id,
        name: x?.name,
        level: x?.level,
        domain: x?.domain,
        parent: x?.parent,
      }))
      .filter((r: Row) => r.name);
  }

  if (data && typeof data === "object") {
    const flat: Row[] = [];
    const walk = (n: any, parentName?: string) => {
      flat.push({
        id: n?.id,
        name: n?.name,
        level: n?.level,
        domain: n?.domain,
        parent: parentName,
      });
      (n?.children ?? []).forEach((c: any) => walk(c, n?.name));
    };
    walk(data);
    return flat.filter((r) => r.name);
  }

  throw new Error("Unsupported JSON shape. Provide an array of rows or a tree object.");
}
/* ---------------- VISION API ---------------- */
export async function extractFromVision(file: File): Promise<Row[]> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/vision", { method: "POST", body: fd });
  if (!res.ok) throw new Error(`vision: ${res.status}`);
  const data = await res.json();
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  // Convert ExtractedRow -> Row (your internal shape)
  return rows.map((r: any, i: number) => ({
    id: r.id ?? `tmp-${i}`,
    name: r.name,
    level: r.level ?? undefined,
    parent: r.parent ?? undefined,
    domain: r.domain ?? undefined,
  }));
}
/* -------------- Tree build -------------- */

function buildTree(rows: Row[]): { roots: Capability[]; issues: string[] } {
  const issues: string[] = [];
  const l1s: Capability[] = [];
  const l1ByName = new Map<string, Capability>();
  const l2Buckets = new Map<string, Capability[]>();
  const l3Buckets = new Map<string, Capability[]>();

  for (const r of rows) {
    const lvl = toLevel(r.level) ?? "L1";
    if (lvl === "L1") {
      const cap: Capability = {
        id: r.id ?? `l1-${Math.random().toString(36).slice(2, 8)}`,
        name: r.name,
        level: "L1",
        domain: r.domain?.trim() || "Unassigned",
        children: [],
      };
      l1s.push(cap);
      l1ByName.set(r.name, cap);
    } else if (lvl === "L2") {
      const list = l2Buckets.get(r.parent ?? "") ?? [];
      list.push({
        id: r.id ?? `l2-${Math.random().toString(36).slice(2, 8)}`,
        name: r.name,
        level: "L2",
        children: [],
      } as Capability);
      l2Buckets.set(r.parent ?? "", list);
    } else if (lvl === "L3") {
      const list = l3Buckets.get(r.parent ?? "") ?? [];
      list.push({
        id: r.id ?? `l3-${Math.random().toString(36).slice(2, 8)}`,
        name: r.name,
        level: "L3",
      } as Capability);
      l3Buckets.set(r.parent ?? "", list);
    }
  }

  for (const [parentName, l2s] of l2Buckets.entries()) {
    const p = l1ByName.get(parentName);
    if (!p) {
      issues.push(`Orphan L2(s) missing L1 parent: "${parentName}"`);
      continue;
    }
    for (const l2 of l2s) {
      (l2 as any).domain = (p as any).domain; // inherit domain
      p.children!.push(l2);
    }
  }

  const l2ByName = new Map<string, Capability>();
  for (const l1 of l1s) for (const l2 of l1.children ?? []) l2ByName.set(l2.name, l2);

  for (const [parentName, l3s] of l3Buckets.entries()) {
    const p = l2ByName.get(parentName);
    if (!p) {
      issues.push(`Orphan L3(s) missing L2 parent: "${parentName}"`);
      continue;
    }
    if (!p.children) p.children = [];
    for (const l3 of l3s) p.children.push(l3);
  }

  return { roots: l1s, issues };
}

/* -------------- Public hook -------------- */

export function useMapIntelligence(ai = localHeuristicAi) {
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const parseString = React.useCallback(
    async (input: string, kind: ImportKind, existingL1Names: string[] = []) => {
      setBusy(true);
      setError(null);
      try {
        const rows =
          kind === "csv"
            ? parseCsv(input ?? "")
            : parseJson(input ?? ""); // ← hardened

        const { roots, issues } = buildTree(rows);

        const suggestions: Record<string, Suggestion[]> = {};
        for (const r of rows) {
          const lvl = toLevel(r.level) ?? "L1";
          if (lvl === "L1" && r.name) {
            if (
              !existingL1Names.some(
                (n) => n.trim().toLowerCase() === r.name.trim().toLowerCase()
              )
            ) {
              suggestions[r.name] = await ai.suggest(r.name, existingL1Names, 5);
            }
          }
        }

        let aiResult: ReasoningAlignResult | undefined;
        try {
          aiResult = await alignViaApi(
            rows.map<ReasoningAlignRow>((r) => ({
              id: r.id,
              name: r.name,
              level: r.level ?? "L1",
              domain: r.domain,
              parent: r.parent,
            })),
            existingL1Names
          );
        } catch (e: any) {
          console.error("Auto AI align failed:", e);
          setError((prev) => prev || (e?.message ?? "AI align failed"));
          aiResult = { suggestions: [], issues: [e?.message ?? "AI align failed"] };
        }

        const nextPreview = {
          roots,
          flatCount: rows.length,
          issues,
          suggestions,
          aiResult,
        };
        setPreview(nextPreview);
        return nextPreview;
      } catch (e: any) {
        setError(e?.message ?? "Parse failed");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [ai]
  );

  const parseFile = React.useCallback(
    async (file: File, existingL1Names: string[] = []) => {
      const k = extOf(file.name);
      if (!k) throw new Error("Unsupported file type. Use .csv or .json");
      const text = await file.text();
      return parseString(text, k, existingL1Names);
    },
    [parseString]
  );

  const applyToProject = React.useCallback(
    async (projectId: string, storage: StoragePort) => {
      if (!preview) throw new Error("No preview to apply");
      await storage.save(projectId, preview.roots);
    },
    [preview]
  );

  const reset = React.useCallback(() => setPreview(null), []);

  return { busy, error, preview, parseString, parseFile, applyToProject, reset };
}

/* -------------- helpers -------------- */

function extOf(filename: string): ImportKind | null {
  const m = filename.toLowerCase().match(/\.(csv|json)$/);
  return (m?.[1] as ImportKind) ?? null;
}
