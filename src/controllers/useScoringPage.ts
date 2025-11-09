"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { StoragePort } from "@/domain/ports/storage";
import type { Capability, Scores } from "@/domain/model/capability";
import {
  compositeScore,
  defaultWeights,
  type Weights,
} from "@/domain/services/scoring";

const WKEY = (p: string) => `fuxi:weights:${p}`;

function normalize(w: Weights): Weights {
  const sum =
    w.opportunity +
      w.maturity +
      w.techFit +
      w.strategicAlignment +
      w.peopleReadiness || 1;
  return {
    opportunity: w.opportunity / sum,
    maturity: w.maturity / sum,
    techFit: w.techFit / sum,
    strategicAlignment: w.strategicAlignment / sum,
    peopleReadiness: w.peopleReadiness / sum,
  };
}

function compositeFor(cap: Capability, weights: Weights): number {
  const kids = cap.children ?? [];
  if (kids.length > 0) {
    const vals = kids.map((c) => compositeFor(c, weights));
    const sum = vals.reduce((a, b) => a + b, 0);
    return vals.length ? sum / vals.length : 0;
  }
  return compositeScore(cap.scores ?? {}, weights);
}

function findById(rootList: Capability[], id: string): Capability | null {
  const stack = [...rootList];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.id === id) return n;
    if (n.children?.length) stack.push(...n.children);
  }
  return null;
}

export function useScoringPage(projectId: string, storage: StoragePort) {
  const [roots, setRoots] = useState<Capability[]>([]);
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const [openId, setOpenId] = useState<string | null>(null);
  const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>({});

  // central reload function (so ImportPanel can refresh the page after import)
  const reload = useCallback(async () => {
    const rows = await storage.load(projectId);
    setRoots(rows);
  }, [projectId, storage]);

  // initial load
  useEffect(() => {
    let mounted = true;
    storage.load(projectId).then((rows) => {
      if (!mounted) return;
      setRoots(rows);
    });
    return () => {
      mounted = false;
    };
  }, [projectId, storage]);

  // weights load/save
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WKEY(projectId));
      if (raw) setWeights(normalize(JSON.parse(raw) as Weights));
    } catch {}
  }, [projectId]);

  useEffect(() => {
    try {
      localStorage.setItem(WKEY(projectId), JSON.stringify(weights));
    } catch {}
  }, [projectId, weights]);

  // items (L1)
  const items = useMemo(
    () =>
      roots.map((c) => ({
        id: c.id,
        name: c.name,
        domain: c.domain ?? "Unassigned",
        score: compositeFor(c, weights),
        raw: c,
      })),
    [roots, weights]
  );

  const selected = useMemo(
    () => (openId ? findById(roots, openId) : null),
    [openId, roots]
  );

  const addL1 = useCallback(
    (name: string, domain?: string) => {
      const n = name.trim();
      if (!n) return;
      const d = (domain ?? "").trim() || "Unassigned";

      setRoots((prev) => {
        const clone = structuredClone(prev) as Capability[];
        clone.push({
          id: `cap-${Math.random().toString(36).slice(2, 8)}`,
          name: n,
          level: "L1" as any,
          domain: d,
          children: [],
        });
        storage.save(projectId, clone);
        return clone;
      });
    },
    [projectId, storage]
  );

  const updateScores = useCallback(
    async (id: string, patch: Partial<Scores>) => {
      setRoots((prev) => {
        const clone = structuredClone(prev) as Capability[];
        const target = findById(clone, id);
        if (target) {
          target.scores = { ...(target.scores ?? {}), ...patch };
        }
        storage.save(projectId, clone);
        return clone;
      });
    },
    [projectId, storage]
  );

  const toggleExpanded = useCallback((id: string) => {
    setExpandedL1((m) => ({ ...m, [id]: !m[id] }));
  }, []);

  return {
    items,
    weights,
    setWeights: (w: Weights) => setWeights(normalize(w)),
    openId,
    setOpenId,
    selected,
    updateScores,
    expandedL1,
    toggleExpanded,
    compositeFor: (cap: Capability) => compositeFor(cap, weights),
    addL1,
    reload, // ← expose for ImportPanel
  };
}