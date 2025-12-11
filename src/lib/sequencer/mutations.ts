import type { IntentEventOMS, SequencerMutation, SequencerStep } from "./types";

const CHANNEL_SYSTEM_MAP: Record<string, string[]> = {
  b2b: ["OMS Core"],
  b2c: ["MFCS Experience"],
  retail: ["OMS Stores"],
};

export function applyIntentToSequence(
  event: IntentEventOMS,
  sequence: SequencerStep[],
): { mutation: SequencerMutation; nextSequence: SequencerStep[]; confirmation: string } {
  const region = event.payload.region ?? "Global";
  const target = sequence.find((step) => step.region.toLowerCase() === region.toLowerCase()) ?? sequence[0];
  const phase = (event.payload.phase ?? target.phase).toLowerCase();
  const timeline = event.payload.timeline ?? phase;
  const systems = Array.from(
    new Set(
      event.payload.channels.flatMap((channel) => CHANNEL_SYSTEM_MAP[channel.toLowerCase()] ?? ["OMS Core"]),
    ),
  );

  let nextSequence = sequence.map((step) =>
    step.id === target.id ? { ...step, phase, region, impact: Math.min(0.95, step.impact + 0.05) } : step,
  );

  if (event.payload.action === "decouple" && event.payload.target) {
    const targetKey = event.payload.target.toLowerCase();
    nextSequence = nextSequence.map((step) => ({
      ...step,
      dependencies: step.dependencies?.filter((dep) => !dep.toLowerCase().includes(targetKey)) ?? [],
    }));
  }

  const mutation: SequencerMutation = {
    mutationType: "updatePhase",
    targetRegion: region,
    updates: {
      phase,
      timeline,
      systems,
      dependencies: event.payload.action === "decouple" && event.payload.target ? [`removed:${event.payload.target}`] : [],
    },
  };

  const confirmation = `Sequencer updated: ${region} → ${phase.toUpperCase()} (${systems.join(", ")})`;

  return { mutation, nextSequence, confirmation };
}
