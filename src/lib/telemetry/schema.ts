import { z } from "zod";

export const workspaceEnum = z.enum([
  "intake",
  "tech_stack",
  "digital_enterprise",
  "portfolio",
  "insights",
  "harmonization_review",
  "transformation_dialogue",
  "connection_confirmation",
]);

export const TelemetryEventSchema = z.object({
  session_id: z.string().min(1),
  project_id: z.string().optional(),
  workspace_id: workspaceEnum,
  event_type: z.string().min(1),
  timestamp: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
  simplification_score: z.number().optional(),
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

export function normalizeTelemetryPayload(
  payload: Partial<TelemetryEvent>,
): TelemetryEvent {
  const base = payload && typeof payload === "object" ? payload : {};
  const withDefaults = {
    timestamp: new Date().toISOString(),
    ...base,
  };
  // Lightweight validation to avoid bundler/runtime issues with Zod during dev.
  return {
    session_id: (withDefaults as any).session_id ?? "server",
    workspace_id: (withDefaults as any).workspace_id ?? "digital_enterprise",
    event_type: (withDefaults as any).event_type ?? "unknown",
    timestamp: withDefaults.timestamp,
    data: (withDefaults as any).data,
    simplification_score: (withDefaults as any).simplification_score,
  } as TelemetryEvent;
}
