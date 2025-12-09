export type TelemetryPayload = Record<string, unknown>;

export const emitTelemetry = (type: string, payload: TelemetryPayload = {}) => {
  // Bootstrap logger – replace with production transport in D077C
  // eslint-disable-next-line no-console
  console.log(`[TELEMETRY] ${type}`, payload);
};

export const logAdaptiveChange = (message: string, context: TelemetryPayload = {}) => {
  // eslint-disable-next-line no-console
  console.log(`[INFO] adaptive: ${message}`, context);
};
