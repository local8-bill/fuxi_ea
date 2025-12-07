const SCRIPT_KEYWORDS: Record<string, string[]> = {
  harmonization: ["harmonization", "harmonize", "map", "graph", "systems"],
  roi: ["roi", "return", "forecast", "benefit", "break-even"],
  sequencer: ["sequence", "sequencer", "roadmap", "waves", "modernize"],
};

export type DemoScript = {
  topic: string;
  title: string;
  summary: string;
  steps: Array<{ id: string; title: string; detail: string }>;
  completion: string;
};

const DEMO_SCRIPTS: Record<string, DemoScript> = {
  harmonization: {
    topic: "harmonization",
    title: "Harmonization walkthrough",
    summary: "Here’s how we consolidate systems per D068 before sequencing.",
    steps: [
      {
        id: "step-1",
        title: "Ingest & tag",
        detail: "I pull Lucid, inventory, and future-state files, tagging each system with domain, platform, and state metadata.",
      },
      {
        id: "step-2",
        title: "Detect overlaps",
        detail: "Using the harmonization engine, I match Finance ↔ ERP and other cross-domain overlaps, surfacing conflicts for review.",
      },
      {
        id: "step-3",
        title: "Stage dependencies",
        detail: "Dependencies feed Sequencer so wave planning understands which integrations must move together.",
      },
    ],
    completion: "Ready to run this on your data or open the Digital Enterprise view?",
  },
  roi: {
    topic: "roi",
    title: "ROI forecasting walkthrough",
    summary: "The ROI dashboard models net benefit and TCC guardrails before finance review.",
    steps: [
      {
        id: "step-1",
        title: "Collect drivers",
        detail: "We import benefit hypotheses, cost envelopes, and TCC categories, aligning them to domains.",
      },
      {
        id: "step-2",
        title: "Model break-even",
        detail: "Using the harmonized timeline, I calculate cumulative cost vs. benefit and highlight break-even month.",
      },
      {
        id: "step-3",
        title: "Surface guardrails",
        detail: "TCC ratios and scenario deltas are flagged for finance so Sequencer waves stay within the approved runway.",
      },
    ],
    completion: "Want me to open your ROI dashboard or simulate a scenario?",
  },
  sequencer: {
    topic: "sequencer",
    title: "Sequencer walkthrough",
    summary: "Sequencer builds modernization waves based on harmonized dependencies.",
    steps: [
      {
        id: "step-1",
        title: "Prioritize",
        detail: "I score systems by value, complexity, and dependency count to determine candidate waves.",
      },
      {
        id: "step-2",
        title: "Stage waves",
        detail: "Dependencies lock each wave, ensuring Finance core precedes ERP integration before Data scale-out.",
      },
      {
        id: "step-3",
        title: "Sync telemetry",
        detail: "Wave readiness signals feed back into ROI and Harmonization review for approvals.",
      },
    ],
    completion: "Should I open Sequencer or export the current roadmap?",
  },
};

export function detectDemoTopic(input: string): string | null {
  const lower = input.toLowerCase();
  for (const [topic, keywords] of Object.entries(SCRIPT_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) return topic;
  }
  return null;
}

export function getDemoScript(topic?: string): DemoScript {
  if (topic && DEMO_SCRIPTS[topic]) return DEMO_SCRIPTS[topic];
  return DEMO_SCRIPTS.harmonization;
}
