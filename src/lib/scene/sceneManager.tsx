"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { createStore, type StoreApi } from "zustand";
import { useStore } from "zustand";

export type SceneType = "digitalTwin" | "sequence" | "roi" | "intelligence";

export type SceneLogEntry = {
  scene: SceneType;
  timestamp: number;
  note?: string;
};

type SceneManagerState = {
  activeScene: SceneType;
  transitionLog: SceneLogEntry[];
  setScene: (scene: SceneType, note?: string) => void;
  reset: () => void;
};

type SceneManagerStore = StoreApi<SceneManagerState>;

const SceneManagerContext = createContext<SceneManagerStore | null>(null);

function createSceneManagerStore() {
  return createStore<SceneManagerState>((set) => ({
    activeScene: "digitalTwin",
    transitionLog: [{ scene: "digitalTwin", timestamp: Date.now(), note: "initial" }],
    setScene: (scene, note) =>
      set((state) => ({
        activeScene: scene,
        transitionLog: [...state.transitionLog, { scene, timestamp: Date.now(), note }],
      })),
    reset: () =>
      set({
        activeScene: "digitalTwin",
        transitionLog: [{ scene: "digitalTwin", timestamp: Date.now(), note: "reset" }],
      }),
  }));
}

export function SceneManagerProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SceneManagerStore>();
  if (!storeRef.current) {
    storeRef.current = createSceneManagerStore();
  }

  const contextValue = useMemo(() => storeRef.current as SceneManagerStore, []);

  return <SceneManagerContext.Provider value={contextValue}>{children}</SceneManagerContext.Provider>;
}

export function useSceneManager<T>(selector: (state: SceneManagerState) => T): T {
  const store = useContext(SceneManagerContext);
  if (!store) {
    throw new Error("SceneManagerProvider is missing in the component tree.");
  }
  return useStore(store, selector);
}

export type { SceneManagerState };
