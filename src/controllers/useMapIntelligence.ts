// src/controllers/useMapIntelligence.ts
"use client";

import * as React from "react";
import type { Capability } from "@/domain/model/capability";
import type { StoragePort } from "@/domain/ports/storage";
import { alignViaApi } from "@/adapters/reasoning/client";
import type { ReasoningAlignResult, ReasoningAlignRow } from "@/domain/ports/reasoning";
import { localHeuristicAi, type Suggestion } from "@/domain/services/aiMapping";

const clientAuthHeader = process.env.NEXT_PUBLIC_FUXI_API_TOKEN
  ? { Authorization: `Bearer ${process.env.NEXT_PUBLIC_FUXI_API_TOKEN}` }
  : undefined;

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

const LEVELS: ReadonlyArray<"L1" | "L2" | "L3"> = ["L1", "L2", "L3"];
const LEVEL_SET = new Set(LEVELS.map((lvl) => lvl.toLowerCase()));

function toLevel(value?: string): "L1" | "L2" | "L3" | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!LEVEL_SET.has(normalized)) return undefined;
  return normalized.toUpperCase() as "L1" | "L2" | "L3";
}

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

/* ---------------- CSV ---------------- */

function parseCsv(input: string): Row[] {
  const text = (input ?? "").replace(/\r\n/g, "\n");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const record: Record<string, string> = {};
    header.forEach((h, idx) => {
      record[h] = (cols[idx] ?? "").trim();
    });
    rows.push({
      id: record["id"] || undefined,
      name: record["name"] || record["capability"] || record["cap"] || "",
      level: record["level"] || record["lvl"] || record["l"],
      domain: record["domain"] || record["area"] || record["group"] || undefined,
      parent: record["parent"] || record["parent name"] || record["parent_name"] || undefined,
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

const isPlainObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const readString = (value: unknown | undefined): string | undefined =>
  typeof value === "string" && value.trim().length ? value : undefined;

/* ---------------- JSON ---------------- */

type JsonTreeRow = Partial<Row> & { children?: JsonTreeRow[] };

function parseJson(input: string): Row[] {
  // Trim, strip BOMs, guard empties
  const s = (input ?? "").replace(/^\uFEFF/, "").trim();
  if (!s) {
    throw new Error("No JSON provided. Paste a JSON array of rows or a single tree object.");
  }

  let data: unknown;
  try {
    data = JSON.parse(s);
  } catch (e) {
    // Surface a helpful message while keeping the original error detail
    const message = e instanceof Error ? e.message : "parse failed";
    throw new Error(`Invalid JSON: ${message}`);
  }

  // Accept either a flat array of rows or a single tree object {name, level, children:[]}
  if (Array.isArray(data)) {
    return data
      .map((raw) => {
        if (!isPlainObject(raw)) return null;
        const candidate: Row = {
          id: readString(raw.id),
          name: readString(raw.name) ?? "",
          level: readString(raw.level),
          domain: readString(raw.domain),
          parent: readString(raw.parent),
        };
        return candidate.name ? candidate : null;
      })
      .filter((r): r is Row => Boolean(r));
  }

  if (isPlainObject(data)) {
    const flat: Row[] = [];
    const walk = (node: JsonTreeRow, parentName?: string) => {
      const row: Row = {
        id: readString(node.id),
        name: readString(node.name) ?? "",
        level: readString(node.level),
        domain: readString(node.domain),
        parent: parentName,
      };
      if (row.name) {
        flat.push(row);
        const children = Array.isArray(node.children) ? node.children : [];
        children.forEach((child) => walk(child, node.name ?? parentName));
      }
    };
    walk(data as JsonTreeRow);
    return flat.filter((r) => r.name);
  }

  throw new Error("Unsupported JSON shape. Provide an array of rows or a tree object.");
}
/* ---------------- VISION API ---------------- */
export async function extractFromVision(file: File): Promise<Row[]> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/vision", {
    method: "POST",
    body: fd,
    headers: clientAuthHeader ?? undefined,
  });
  if (!res.ok) throw new Error(`vision: ${res.status}`);
  const data = await res.json();
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  // Convert ExtractedRow -> Row (your internal shape)
  return rows.map((r: Record<string, unknown>, i: number): Row => ({
    id: readString(r.id) ?? `tmp-${i}`,
    name: readString(r.name) ?? "",
    level: readString(r.level),
    parent: readString(r.parent),
    domain: readString(r.domain),
  }));
}
/* -------------- Tree build -------------- */

function buildTree(rows: Row[]): { roots: Capability[]; issues: string[] } {
  const issues: string[] = [];
  const l1s: Capability[] = [];
  const l1ByName = new Map<string, Capability>();
  const l2Buckets = new Map<string, Capability[]>();
  const l3Buckets = new Map<string, Capability[]>();

  const ensureDomain = (value?: string | null) => value?.trim() || "Unassigned";

  for (const r of rows) {
    const lvl = toLevel(r.level) ?? "L1";
    if (lvl === "L1") {
      const cap: Capability = {
        id: r.id ?? randomId("l1"),
        name: r.name,
        level: "L1",
        domain: ensureDomain(r.domain),
        children: [],
      };
      l1s.push(cap);
      l1ByName.set(r.name, cap);
    } else if (lvl === "L2") {
      const list = l2Buckets.get(r.parent ?? "") ?? [];
      list.push({
        id: r.id ?? randomId("l2"),
        name: r.name,
        level: "L2",
        domain: r.domain?.trim(),
        children: [],
      });
      l2Buckets.set(r.parent ?? "", list);
    } else if (lvl === "L3") {
      const list = l3Buckets.get(r.parent ?? "") ?? [];
      list.push({
        id: r.id ?? randomId("l3"),
        name: r.name,
        level: "L3",
        domain: r.domain?.trim(),
      });
      l3Buckets.set(r.parent ?? "", list);
    }
  }

  for (const [parentName, l2s] of l2Buckets.entries()) {
    const parent = l1ByName.get(parentName);
    if (!parent) {
      issues.push(`Orphan L2(s) missing L1 parent: "${parentName}"`);
      continue;
    }
    for (const l2 of l2s) {
      const inheritedDomain = l2.domain ?? parent.domain ?? "Unassigned";
      if (!parent.children) parent.children = [];
      parent.children.push({ ...l2, domain: inheritedDomain });
    }
  }

  const l2ByName = new Map<string, Capability>();
  for (const l1 of l1s) {
    for (const l2 of l1.children ?? []) {
      l2ByName.set(l2.name, l2);
    }
  }

  for (const [parentName, l3s] of l3Buckets.entries()) {
    const parent = l2ByName.get(parentName);
    if (!parent) {
      issues.push(`Orphan L3(s) missing L2 parent: "${parentName}"`);
      continue;
    }
    if (!parent.children) parent.children = [];
    for (const l3 of l3s) {
      parent.children.push({ ...l3, domain: l3.domain ?? parent.domain });
    }
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
        } catch (e) {
          console.error("Auto AI align failed:", e);
          const message = e instanceof Error ? e.message : "AI align failed";
          setError((prev) => prev || message);
          aiResult = { suggestions: [], issues: [message] };
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
      } catch (e) {
        const message = e instanceof Error ? e.message : "Parse failed";
        setError(message);
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
