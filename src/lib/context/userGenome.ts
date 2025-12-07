import { create } from "zustand";

export type InteractionStyle = "direct" | "narrative";

export type UserGenomeState = {
  userId: string;
  role: string;
  motivation: string;
  interactionStyle: InteractionStyle;
  preferredTone: "confident" | "empathetic" | "analytical";
  focusDomains: string[];
  updateGenome: (patch: Partial<Omit<UserGenomeState, "updateGenome">>) => void;
};

const defaultGenome: Omit<UserGenomeState, "updateGenome"> = {
  userId: "demo-user",
  role: "Architect",
  motivation: "Modernize the core platform without disrupting finance",
  interactionStyle: "direct",
  preferredTone: "confident",
  focusDomains: ["Commerce", "Finance"],
};

export const useUserGenome = create<UserGenomeState>((set) => ({
  ...defaultGenome,
  updateGenome: (patch) =>
    set((state) => ({
      ...state,
      ...patch,
      focusDomains: patch.focusDomains ?? state.focusDomains,
    })),
}));
