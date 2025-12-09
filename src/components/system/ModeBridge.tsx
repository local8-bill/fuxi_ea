"use client";

import { useEffect } from "react";
import { getCurrentMode, switchMode } from "@/lib/context/modeSwitcher";

declare global {
  interface Window {
    FuxiModeSwitcher?: {
      switchMode: typeof switchMode;
      getCurrentMode: typeof getCurrentMode;
    };
  }
}

export function ModeBridge() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.FuxiModeSwitcher = { switchMode, getCurrentMode };
    }
  }, []);
  return null;
}
