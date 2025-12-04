"use client";

import { useEffect, useState } from "react";
import { emitTelemetry } from "@/components/uxshell/telemetry";

const STORAGE_KEY = "fuxi_nav_state";

export function useChevronNav(projectId: string) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.projectId === projectId) {
          setExpanded(parsed?.expanded ?? null);
          setActiveItem(parsed?.activeItem ?? null);
          void emitTelemetry("nav_state_restored", {
            projectId,
            restoredSection: parsed?.expanded,
            restoredItem: parsed?.activeItem,
          });
        }
      }
    } catch {
      // ignore restore errors
    }
  }, [projectId]);

  const persist = (section: string | null, item: string | null) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ projectId, expanded: section, activeItem: item }),
      );
    } catch {
      // ignore
    }
  };

  const toggleSection = (section: string) => {
    const next = expanded === section ? null : section;
    setExpanded(next);
    persist(next, activeItem);
    void emitTelemetry("nav_section_toggled", { projectId, sectionTitle: section });
  };

  const selectItem = (section: string, item: string) => {
    setExpanded(section);
    setActiveItem(item);
    persist(section, item);
    void emitTelemetry("nav_item_selected", { projectId, section, itemLabel: item });
  };

  return { expanded, activeItem, toggleSection, selectItem };
}
