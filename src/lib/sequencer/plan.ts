export type SequencerWave = { id: string; title: string; focus?: string; timelineMonths?: [number, number] };

const normalizePlatforms = (platforms: string[]) => platforms.map((platform) => platform.trim()).filter(Boolean);

const pickFocus = (platforms: string[], start: number, fallback: string) => {
  const slice = platforms.slice(start, start + 2);
  return slice.length ? slice.join(", ") : fallback;
};

export function buildSequencerPlan(platforms: string[], strategy: string = "value") {
  const normalized = normalizePlatforms(platforms);
  const waves: SequencerWave[] = [
    {
      id: "wave-1",
      title: strategy === "complexity" ? "Stabilize High-Risk Core" : "Stabilize Core",
      focus: pickFocus(normalized, 0, "ERP / OMS"),
      timelineMonths: [0, 3],
    },
    {
      id: "wave-2",
      title: strategy === "complexity" ? "Reduce Integration Risk" : "Modernize Experience + Integrations",
      focus: pickFocus(normalized, 2, "Commerce + Integration"),
      timelineMonths: [3, 6],
    },
    {
      id: "wave-3",
      title: strategy === "complexity" ? "Accelerate Data Trust" : "Scale AI + Analytics",
      focus: pickFocus(normalized, 4, "Data / Analytics"),
      timelineMonths: [6, 9],
    },
  ];

  if (normalized.length > 6) {
    waves.push({
      id: "wave-4",
      title: "Extend Capability Rollout",
      focus: pickFocus(normalized, 6, "Experience + Enablement"),
      timelineMonths: [9, 12],
    });
  }

  if (normalized.length > 8) {
    waves.push({
      id: "wave-5",
      title: "Optimize Run + Transform",
      focus: pickFocus(normalized, 8, "Analytics Ops"),
      timelineMonths: [12, 15],
    });
  }

  return { waves, strategy };
}
