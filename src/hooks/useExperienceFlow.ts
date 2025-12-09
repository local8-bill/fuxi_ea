"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ExperienceScene =
  | "command"
  | "onboarding"
  | "digital"
  | "roi"
  | "sequencer"
  | "review"
  | "insights";

type ExperienceState = {
  scenes: Record<string, ExperienceScene>;
  setScene: (projectId: string, scene: ExperienceScene) => void;
};

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const useExperienceStore = create<ExperienceState>()(
  persist(
    (set) => ({
      scenes: {},
      setScene: (projectId, scene) =>
        set((state) => ({
          scenes: { ...state.scenes, [projectId]: scene },
        })),
    }),
    {
      name: "fuxi:experience-scenes",
      storage: createJSONStorage(() => (typeof window === "undefined" ? memoryStorage : localStorage)),
    },
  ),
);

export function useExperienceFlow(projectId: string) {
  const scene = useExperienceStore((state) => state.scenes[projectId] ?? "command");
  const setScene = useExperienceStore((state) => state.setScene);
  const update = (next: ExperienceScene) => setScene(projectId, next);
  return { scene, setScene: update };
}

export function setExperienceScene(projectId: string, scene: ExperienceScene) {
  useExperienceStore.getState().setScene(projectId, scene);
}
