import type { GraphTimelineBand } from "@/components/graph/GraphSimulationControls";
import type { GraphRevealStage, GraphViewMode } from "@/hooks/useGraphTelemetry";
import type { LivingNode } from "@/types/livingMap";

export interface DigitalEnterpriseStats {
  systemsFuture: number;
  integrationsFuture: number;
  domainsDetected?: number;
}

export type FlowStep = "domain" | "system" | "integration" | "insight";
export type FocusType = "platform" | "domain" | "goal";
export type GraphDataSource = "live" | "snapshot" | null;

export const DIGITAL_TWIN_VERSION = "0.2";

export const DIGITAL_TWIN_TIMELINE: GraphTimelineBand[] = [
  { id: "fy26", label: "FY26", summary: "Stabilize foundation" },
  { id: "fy27", label: "FY27", summary: "Unify experiences" },
  { id: "fy28", label: "FY28", summary: "Unlock adaptive network" },
];

export const ACTIONS = [
  {
    key: "redundancy",
    title: "Analyze Redundancies",
    summary: "Surface overlapping systems and pathways adding unnecessary run costs.",
    cta: "Open Redundancy Map",
    href: (projectId: string) => `/project/${projectId}/experience?scene=digital&lens=redundancy`,
  },
  {
    key: "roi",
    title: "Assess ROI",
    summary: "Estimate ROI impact for this focus area and capture it as a scenario.",
    cta: "Open ROI Dashboard",
    href: (projectId: string) => `/project/${projectId}/experience?scene=roi`,
  },
  {
    key: "modernization",
    title: "Simulate Modernization",
    summary: "Model the impact of retiring or upgrading systems via the sequencer.",
    cta: "Open Sequencer",
    href: (projectId: string) => `/project/${projectId}/experience?scene=sequencer`,
  },
] as const;

export const FOCUS_LENSES: Array<{ type: FocusType; label: string }> = [
  { type: "platform", label: "By Platform" },
  { type: "domain", label: "By Domain" },
  { type: "goal", label: "By Goal" },
];

export const DIGITAL_TWIN_DENOISE_MODE = true;

export const PLATFORM_OPTIONS = ["ERP", "Commerce", "CRM", "Data", "Supply Chain"];
export const GOAL_OPTIONS = ["Modernization", "Cost", "ROI"];

export const GOAL_HEURISTICS: Record<string, (node: LivingNode) => number> = {
  modernization: (node) => 100 - (node.aiReadiness ?? 50),
  cost: (node) => node.integrationCount ?? 0,
  roi: (node) => node.roiScore ?? 0,
};

export const LEFT_RAIL_STORAGE_KEY = "digital_twin_left_rail";
export const RIGHT_RAIL_STORAGE_KEY = "digital_twin_right_rail";

export const VIEW_MODE_OPTIONS: Array<{ id: GraphViewMode; label: string }> = [
  { id: "systems", label: "Systems" },
  { id: "domain", label: "Domain" },
  { id: "roi", label: "ROI" },
  { id: "sequencer", label: "Sequencer" },
  { id: "capabilities", label: "Capabilities" },
];

export const STAGE_OPTIONS: Array<{ id: GraphRevealStage; label: string; helper: string }> = [
  { id: "orientation", label: "Orientation", helper: "Calm" },
  { id: "exploration", label: "Exploration", helper: "Curious" },
  { id: "connectivity", label: "Connectivity", helper: "Energized" },
  { id: "insight", label: "Insight", helper: "Analytical" },
];

export const DOMAIN_ALE_TAGS: Record<string, string[]> = {
  commerce: ["inventory_visibility_dependency", "temporary_integration_path"],
  finance: ["foundational_system_coupling", "parallel_legacy_enhancement"],
  supply: ["inventory_snapshot_logic", "virtual_warehouse_segmentation"],
  "supply chain": ["inventory_snapshot_logic", "virtual_warehouse_segmentation"],
  goal: ["effort_based_option_pruning"],
  default: ["governance_alignment_checkpoint"],
};
