import type { IntentEventOMS, SequencerMutation, SequencerStep } from "./types";

const CHANNEL_SYSTEM_MAP: Record<string, Array<{ id: string; label: string }>> = {
  b2b: [
    { id: "com-web", label: "Web Storefront" },
    { id: "sup-planning", label: "Demand Planning" },
    { id: "sup-wms", label: "Warehouse Ops" },
  ],
  b2c: [
    { id: "com-web", label: "Web Storefront" },
    { id: "com-loyalty", label: "Loyalty Engine" },
    { id: "sup-logistics", label: "Logistics Mesh" },
  ],
  retail: [
    { id: "com-pos", label: "Retail POS" },
    { id: "sup-wms", label: "Warehouse Ops" },
    { id: "sup-logistics", label: "Logistics Mesh" },
  ],
};

const DEFAULT_SYSTEMS = [
  { id: "com-web", label: "Web Storefront" },
  { id: "com-pos", label: "Retail POS" },
];

export function applyIntentToSequence(
  event: IntentEventOMS,
  sequence: SequencerStep[],
): { mutation: SequencerMutation; nextSequence: SequencerStep[]; confirmation: string } {
  const region = event.payload.region ?? "Global";
  const target = sequence.find((step) => step.region.toLowerCase() === region.toLowerCase()) ?? sequence[0];
  const phase = (event.payload.phase ?? target.phase).toLowerCase();
  const timeline = event.payload.timeline ?? phase;
  const systemEntries = event.payload.channels.flatMap(
    (channel) => CHANNEL_SYSTEM_MAP[channel.toLowerCase()] ?? DEFAULT_SYSTEMS,
  );
  const uniqueSystems = new Map<string, { id: string; label: string }>();
  systemEntries.forEach((entry) => {
    if (!uniqueSystems.has(entry.id)) {
      uniqueSystems.set(entry.id, entry);
    }
  });
  const systems = Array.from(uniqueSystems.values());

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
      systems: systems.map((system) => system.id),
      dependencies: event.payload.action === "decouple" && event.payload.target ? [`removed:${event.payload.target}`] : [],
    },
  };

  const confirmationLabels = systems.map((system) => system.label).join(", ");
  const confirmation = `Sequencer updated: ${region} → ${phase.toUpperCase()} (${confirmationLabels})`;

  return { mutation, nextSequence, confirmation };
}
