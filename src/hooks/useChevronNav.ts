"use client";

import { useEffect, useState } from "react";
import { emitTelemetry } from "@/components/uxshell/telemetry";

type MainSection = "Projects" | "Views" | "Modes";

const STORAGE_KEY = "fuxi_nav_state";
const DEFAULT_SECTION: MainSection = "Projects";

type StoredState = {
  projectId: string;
  expandedMain: MainSection | null;
  roiExpanded: boolean;
  activeItem: string | null;
};

export function useChevronNav(projectId: string) {
  const [expandedMain, setExpandedMain] = useState<MainSection | null>(DEFAULT_SECTION);
  const [roiExpanded, setRoiExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredState;
      if (parsed?.projectId === projectId) {
        setExpandedMain(parsed.expandedMain ?? DEFAULT_SECTION);
        setRoiExpanded(Boolean(parsed.roiExpanded));
        setActiveItem(parsed.activeItem ?? null);
        void emitTelemetry("uxshell_click", {
          projectId,
          action: "state_restore",
          section: parsed.expandedMain,
          item: parsed.activeItem,
        });
      }
    } catch {
      // ignore restore errors
    }
  }, [projectId]);

  const persist = (nextMain = expandedMain, nextRoi = roiExpanded, nextItem = activeItem) => {
    try {
      const snapshot: StoredState = {
        projectId,
        expandedMain: nextMain,
        roiExpanded: nextRoi,
        activeItem: nextItem,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore persistence failures
    }
  };

  const toggleMain = (section: MainSection) => {
    const wasExpanded = expandedMain === section;
    const nextMain = wasExpanded ? null : section;

    if (!wasExpanded && expandedMain && expandedMain !== section) {
      void emitTelemetry("uxshell_collapse", { projectId, section: expandedMain });
    }

    setExpandedMain(nextMain);
    if (section === "Views" && wasExpanded) {
      setRoiExpanded(false);
    }
    persist(nextMain, section === "Views" && wasExpanded ? false : roiExpanded, activeItem);

    void emitTelemetry("uxshell_click", { projectId, section, action: "toggle" });
    void emitTelemetry("uxshell_interaction", { projectId, section, action: wasExpanded ? "collapse" : "expand" });
    void emitTelemetry(wasExpanded ? "uxshell_collapse" : "uxshell_expand", { projectId, section });
  };

  const toggleRoi = () => {
    const next = !roiExpanded;
    setRoiExpanded(next);
    persist(expandedMain, next, activeItem);
    void emitTelemetry("uxshell_click", { projectId, section: "Σ ROI", action: "toggle" });
    void emitTelemetry("uxshell_interaction", { projectId, section: "Σ ROI", action: next ? "expand" : "collapse" });
    void emitTelemetry(next ? "uxshell_expand" : "uxshell_collapse", { projectId, section: "Σ ROI" });
  };

  const selectItem = (section: MainSection, item: string, options?: { ensureRoi?: boolean }) => {
    if (expandedMain !== section) {
      if (expandedMain) {
        void emitTelemetry("uxshell_collapse", { projectId, section: expandedMain });
      }
      setExpandedMain(section);
      void emitTelemetry("uxshell_expand", { projectId, section });
    }
    if (section === "Views" && options?.ensureRoi) {
      setRoiExpanded(true);
      void emitTelemetry("uxshell_expand", { projectId, section: "Σ ROI" });
    }

    setActiveItem(item);
    persist(section, section === "Views" ? options?.ensureRoi ?? roiExpanded : roiExpanded, item);

    void emitTelemetry("uxshell_click", { projectId, section, item });
    void emitTelemetry("uxshell_interaction", { projectId, section, action: "select", item });
    void emitTelemetry("uxshell_load_view", { projectId, section, item });
  };

  return { expandedMain, roiExpanded, activeItem, toggleMain, toggleRoi, selectItem };
}
