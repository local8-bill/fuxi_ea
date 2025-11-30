"use client";

import React from "react";
import { useTelemetry } from "./useTelemetry";

type StepStatus = "active" | "complete";

export function useProjectState(projectId: string, step: string) {
  const { log } = useTelemetry("tech_stack", { projectId }); // workspace used only for telemetry channel; event distinguishes step

  const postStep = React.useCallback(
    async (status: StepStatus) => {
      try {
        await fetch("/api/projects/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, step, status }),
        });
        log("project_flow_step", { step, status });
      } catch (err) {
        // swallow; non-blocking
        console.warn("[PROJECT-STATE] failed to update step", err);
      }
    },
    [projectId, step, log],
  );

  React.useEffect(() => {
    void postStep("active");
  }, [postStep]);

  return {
    markComplete: () => void postStep("complete"),
  };
}
