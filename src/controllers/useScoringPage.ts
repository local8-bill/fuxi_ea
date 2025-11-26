"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StoragePort } from "@/domain/ports/storage";
import type { Capability, Scores } from "@/domain/model/capability";
import {
  compositeNode,
  defaultWeights,
  normalizeWeights,
  type Weights,
} from "@/domain/services/scoring";

const WKEY = (p: string) => `fuxi:weights:${p}`;

// ---------- small utils ----------
function jclone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function normalize(w: Weights): Weights {
  return normalizeWeights(w);
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

// ---------- main hook ----------
export function useScoringPage(projectId: string, storage: StoragePort) {
  const [roots, setRoots] = useState<Capability[] | null>(null); // null = loading
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  const [openId, setOpenId] = useState<string | null>(null);
  const [expandedL1, setExpandedL1] = useState<Record<string, boolean>>({});
  const [undoStack, setUndoStack] = useState<Capability[][]>([]);
  const [redoStack, setRedoStack] = useState<Capability[][]>([]);

  // Debounced save to avoid spamming storage on rapid changes
  const saveDebounced = useRef<((data: Capability[]) => void) | null>(null);
  useEffect(() => {
    let timer: any = null;
    saveDebounced.current = (data: Capability[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        storage.save(projectId, data).catch(() => {
          /* best-effort */
        });
      }, 200);
    };
    return () => clearTimeout(timer);
  }, [projectId, storage]);

  // Load capabilities safely
  const reload = useCallback(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await storage.load(projectId);
        if (!mounted) return;
        setRoots(Array.isArray(rows) ? rows : []);
      } catch {
        if (mounted) setRoots([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [projectId, storage]);

  useEffect(() => reload(), [reload]);

  // Load weights (once per project)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WKEY(projectId));
      if (raw) setWeights(normalize(JSON.parse(raw) as Weights));
    } catch {
      // ignore
    }
  }, [projectId]);

  // Persist weights
  useEffect(() => {
    try {
      localStorage.setItem(WKEY(projectId), JSON.stringify(weights));
    } catch {
      // ignore
    }
  }, [projectId, weights]);

  // Derived items (L1 only)
  const items = useMemo(() => {
    if (!roots) return [];
    return roots.map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.domain ?? "Unassigned",
      // —— HERE: use blended multi-level composite ——
      score: compositeNode(c, weights, { blend: 0.5 }),
      raw: c,
    }));
  }, [roots, weights]);

  const selected = useMemo(
    () => (openId && roots ? findById(roots, openId) : null),
    [openId, roots]
  );

  // ➕ Add a new L1 capability (with optional Domain)
  const addL1 = useCallback(
    (name: string, domain?: string) => {
      const n = name.trim();
      if (!n) return;
      const d = (domain ?? "").trim() || "Unassigned";
      setRoots((prev) => {
        const base = prev ?? [];
        setUndoStack((u) => [...u.slice(-19), jclone(base)]);
        setRedoStack([]);
        const clone = jclone(base) as Capability[];
        clone.push({
          id: `cap-${Math.random().toString(36).slice(2, 10)}`,
          name: n,
          level: "L1" as any,
          domain: d,
          children: [],
        });
        saveDebounced.current?.(clone);
        return clone;
      });
    },
    []
  );

  // Update scores on any node, persist full tree (debounced)
  const updateScores = useCallback(
    async (id: string, patch: Partial<Scores>) => {
      setRoots((prev) => {
        const base = prev ?? [];
        setUndoStack((u) => [...u.slice(-19), jclone(base)]);
        setRedoStack([]);
        const clone = jclone(base) as Capability[];

        const target = findById(clone, id);
        if (target) {
          target.scores = { ...(target.scores ?? {}), ...patch };
        }

        saveDebounced.current?.(clone);
        return clone;
      });
    },
    []
  );

  const updateCapability = useCallback((id: string, patch: Partial<Capability>) => {
    setRoots((prev) => {
      const base = prev ?? [];
      setUndoStack((u) => [...u.slice(-19), jclone(base)]);
      setRedoStack([]);
      const clone = jclone(base) as Capability[];
      const target = findById(clone, id);
      if (target) Object.assign(target, patch);
      saveDebounced.current?.(clone);
      return clone;
    });
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedL1((m) => ({ ...m, [id]: !m[id] }));
  }, []);

  const moveL1 = useCallback((dragId: string, hoverId: string) => {
    setRoots((prev) => {
      const base = prev ?? [];
      const dragIndex = base.findIndex((c) => c.id === dragId);
      const hoverIndex = base.findIndex((c) => c.id === hoverId);
      if (dragIndex < 0 || hoverIndex < 0 || dragIndex === hoverIndex) return base;
      setUndoStack((u) => [...u.slice(-19), jclone(base)]);
      setRedoStack([]);
      const clone = jclone(base) as Capability[];
      const [removed] = clone.splice(dragIndex, 1);
      clone.splice(hoverIndex, 0, removed);
      saveDebounced.current?.(clone);
      return clone;
    });
  }, []);

  const moveL2 = useCallback((parentId: string, dragId: string, hoverId: string) => {
    setRoots((prev) => {
      const base = prev ?? [];
      const parent = findById(base, parentId);
      if (!parent || !parent.children) return base;
      const dragIndex = parent.children.findIndex((c) => c.id === dragId);
      const hoverIndex = parent.children.findIndex((c) => c.id === hoverId);
      if (dragIndex < 0 || hoverIndex < 0 || dragIndex === hoverIndex) return base;
      setUndoStack((u) => [...u.slice(-19), jclone(base)]);
      setRedoStack([]);
      const clone = jclone(base) as Capability[];
      const parentClone = findById(clone, parentId);
      if (!parentClone || !parentClone.children) return base;
      const [removed] = parentClone.children.splice(dragIndex, 1);
      parentClone.children.splice(hoverIndex, 0, removed);
      saveDebounced.current?.(clone);
      return clone;
    });
  }, []);

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (!stack.length || roots === null) return stack;
      const prev = stack[stack.length - 1];
      setRedoStack((r) => [...r, jclone(roots)]);
      setRoots(jclone(prev));
      return stack.slice(0, -1);
    });
  }, [roots]);

  const redo = useCallback(() => {
    setRedoStack((stack) => {
      if (!stack.length || roots === null) return stack;
      const next = stack[stack.length - 1];
      setUndoStack((u) => [...u, jclone(roots)]);
      setRoots(jclone(next));
      return stack.slice(0, -1);
    });
  }, [roots]);

  return {
    // ready state
    loading: roots === null,
    // data for page
    items,
    weights,
    setWeights: (w: Weights) => setWeights(normalize(w)),
    // drawer selection
    openId,
    setOpenId,
    selected,
    updateScores,
    updateCapability,
    // accordion state
    expandedL1,
    toggleExpanded,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    // helpers the card may use
    compositeFor: (cap: Capability) => compositeNode(cap, weights, { blend: 0.5 }),
    // actions
    addL1,
    moveL1,
    moveL2,
    reload: () => void reload(),
  };
}
