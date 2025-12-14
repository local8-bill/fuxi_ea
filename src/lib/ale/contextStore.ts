"use client";

import { useSyncExternalStore } from "react";

export type AleContext = {
  roi_signals?: Record<string, unknown>;
  tcc_signals?: Record<string, unknown>;
  readiness?: Record<string, unknown>;
  previous_sequences?: unknown[];
  [key: string]: unknown;
} | null;

const STORAGE_KEY = "fuxi_ale_context_cache";

class ALEContextStore {
  private data: AleContext = null;
  private listeners = new Set<() => void>();

  get() {
    return this.data;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  initialize(ctx: AleContext) {
    this.data = ctx;
    if (typeof window !== "undefined" && ctx) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
      } catch {
        // ignore storage errors
      }
    }
    this.emit();
  }

  loadFromCache() {
    if (typeof window === "undefined") return this.data;
    try {
      const cached = window.localStorage.getItem(STORAGE_KEY);
      if (cached) {
        this.data = JSON.parse(cached);
        this.emit();
      }
    } catch {
      // ignore parse/cache errors
    }
    return this.data;
  }
}

export const aleContextStore = new ALEContextStore();

export function useALEContext() {
  return useSyncExternalStore(aleContextStore.subscribe, () => aleContextStore.get(), () => aleContextStore.get());
}
