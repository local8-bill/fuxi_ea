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

export const eventType = z.string().min(1);

export const TelemetryEventSchema = z.object({
  session_id: z.string().min(1),
  project_id: z.string().optional(),
  workspace_id: workspaceEnum,
  event_type: eventType,
  timestamp: z.string().optional(),
  data: z.record(z.any()).optional(),
  simplification_score: z.number().optional(),
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

export function normalizeTelemetryPayload(payload: Partial<TelemetryEvent>): TelemetryEvent {
  const base =
    payload && typeof payload === "object"
      ? payload
      : {};
  const withDefaults = {
    timestamp: new Date().toISOString(),
    ...base,
  };
  const parsed = TelemetryEventSchema.safeParse(withDefaults);
  if (!parsed.success) {
    const message = parsed.error?.message || "Invalid telemetry payload";
    throw new Error(message);
  }
  return parsed.data;
}
