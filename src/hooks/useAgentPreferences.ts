"use client";

import { useCallback, useEffect, useState } from "react";

const PREF_KEY = "uxshell_preferences";

type AgentInterfaceMode = "deck" | "agent";

type StoredPrefs = {
  agent_mode?: AgentInterfaceMode;
  auto_proceed_onboarding?: boolean;
};

function readPrefs(): StoredPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredPrefs;
  } catch {
    return {};
  }
}

function writePrefs(next: StoredPrefs) {
  if (typeof window === "undefined") return;
  try {
    const current = readPrefs();
    window.localStorage.setItem(PREF_KEY, JSON.stringify({ ...current, ...next }));
  } catch {
    // ignore write failures
  }
}

export function useAgentModePreference(defaultMode: AgentInterfaceMode = "deck") {
  const [mode, setMode] = useState<AgentInterfaceMode>(defaultMode);

  useEffect(() => {
    const stored = readPrefs().agent_mode;
    if (stored === "deck" || stored === "agent") {
      setMode(stored);
    }
  }, [defaultMode]);

  const update = useCallback((next: AgentInterfaceMode) => {
    setMode(next);
    writePrefs({ agent_mode: next });
  }, []);

  return [mode, update] as const;
}

export function useAutoProceedPreference(defaultValue = false) {
  const [autoProceed, setAutoProceed] = useState<boolean>(defaultValue);

  useEffect(() => {
    const stored = readPrefs().auto_proceed_onboarding;
    if (typeof stored === "boolean") {
      setAutoProceed(stored);
    } else {
      setAutoProceed(defaultValue);
    }
  }, [defaultValue]);

  const toggle = useCallback((next: boolean) => {
    setAutoProceed(next);
    writePrefs({ auto_proceed_onboarding: next });
  }, []);

  return [autoProceed, toggle] as const;
}

export type AgentInterfacePreference = ReturnType<typeof useAgentModePreference>[0];
