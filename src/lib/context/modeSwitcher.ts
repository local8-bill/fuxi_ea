"use client";

import { applyToneProfile } from "@/lib/agent/toneProfiles";

const modes = {
  founder: {
    permissions: ["directives.edit", "codex.execute", "telemetry.view"],
    tone: "analytical",
    visibleUI: ["directivePanel", "systemTelemetry", "agentConsole"],
    skills: ["system_introspection", "directive_analysis"],
    description: "System and architecture control with full visibility.",
  },
  user: {
    permissions: ["project.interact", "upload.artifacts", "chat.eagent"],
    tone: "conversational",
    visibleUI: ["commandDeck", "digitalTwin", "roiPanel"],
    skills: ["user_guidance", "contextual_navigation"],
    description: "Standard product UX with EAgent guidance.",
  },
  demo: {
    permissions: ["readonly.view", "telemetry.showcase"],
    tone: "energetic",
    visibleUI: ["commandDeck", "digitalTwin", "roiPanel", "showcaseBanner"],
    skills: ["presentation_overlay"],
    description: "Live demo presentation overlay for public view.",
  },
  research: {
    permissions: ["analytics.view", "ux.telemetry"],
    tone: "reflective",
    visibleUI: ["insightsDashboard", "telemetryConsole"],
    skills: ["data_visualization", "metric_analysis"],
    description: "Data and UX insights analysis.",
  },
  test: {
    permissions: ["qa.run", "telemetry.log"],
    tone: "neutral",
    visibleUI: ["testPanel", "telemetryConsole"],
    skills: ["automation_control"],
    description: "QA validation mode for automated test suites.",
  },
  support: {
    permissions: ["system.logs", "incident.manage"],
    tone: "calm",
    visibleUI: ["telemetryConsole", "recoveryTools"],
    skills: ["diagnostic_analysis", "error_recovery"],
    description: "System maintenance and support diagnostics.",
  },
  architect: {
    permissions: ["model.design", "sequencer.control", "roi.forecast"],
    tone: "strategic",
    visibleUI: ["sequencer", "roiDashboard", "architectureMap"],
    skills: ["transformation_modeling", "scenario_analysis"],
    description: "Strategic modeling for transformation and ROI/TCC analysis.",
  },
} as const;

export type ModeKey = keyof typeof modes;

let currentMode: ModeKey = "user";

function updatePermissions(permissions: readonly string[]) {
  console.debug("[mode] permissions", permissions);
}

function loadSkills(skills: readonly string[]) {
  console.debug("[mode] skills", skills);
}

function toggleUIComponents(visibleUI: readonly string[]) {
  if (typeof document === "undefined") return;
  document.querySelectorAll<HTMLElement>("[data-ui]").forEach((el) => {
    const id = el.getAttribute("data-ui") ?? "";
    el.classList.toggle("hidden", !visibleUI.includes(id));
  });
}

export function switchMode(newMode: ModeKey) {
  if (!modes[newMode]) return;
  const config = modes[newMode];
  updatePermissions(config.permissions);
  loadSkills(config.skills);
  applyToneProfile(config.tone);
  toggleUIComponents(config.visibleUI);
  currentMode = newMode;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.mode = newMode;
  }
}

export function getCurrentMode(): ModeKey {
  return currentMode;
}

export function getModeConfig(mode: ModeKey) {
  return modes[mode];
}

declare global {
  interface Window {
    FuxiModeSwitcher?: {
      switchMode: typeof switchMode;
      getCurrentMode: typeof getCurrentMode;
    };
  }
}

if (typeof window !== "undefined") {
  window.FuxiModeSwitcher = { switchMode, getCurrentMode };
}
