import { z } from "zod";

export const TelemetryEventSchema = z.object({
  session_id: z.string().min(1),
  project_id: z.string().optional(),
  workspace_id: z.string().min(1),
  event_type: z.string().min(1),
  timestamp: z.string().optional(),
  data: z.record(z.any()).optional(),
  simplification_score: z.number().optional(),
});

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;

export function normalizeTelemetryPayload(
  payload: Partial<TelemetryEvent>,
): TelemetryEvent {
  const withDefaults = {
    timestamp: new Date().toISOString(),
    ...payload,
  };
  return TelemetryEventSchema.parse(withDefaults);
}
