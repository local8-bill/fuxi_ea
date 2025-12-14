"use client";

import { useEffect } from "react";
import { emitTelemetry } from "@/components/uxshell/telemetry";
import type { SceneType } from "./sceneManager";

export function useSceneTelemetry(scene: SceneType | null, meta?: Record<string, unknown>) {
  useEffect(() => {
    if (!scene) return;
    const payload = {
      workspace_id: "scene_harness",
      ...meta,
      scene,
    };
    void emitTelemetry("scene_change", payload);
  }, [scene, meta]);
}
