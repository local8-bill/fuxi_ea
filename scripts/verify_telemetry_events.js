#!/usr/bin/env node

/**
 * Quick validator for telemetry logs produced during the new-project run.
 * Checks `.fuxi/data/telemetry_events.ndjson` for the required event sequence
 * defined in Directive D080/D081.
 */
const fs = require("node:fs");
const path = require("node:path");

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const EVENTS_FILE = path.join(DATA_ROOT, "telemetry_events.ndjson");
const REQUIRED_EVENTS = ["project_created", "artifact_uploaded", "digital_twin_loaded", "roi_stage_calculated", "tcc_computed", "mode_switch", "uxshell_view_selected"];

const EVENT_ALIASES = {
  project_created: ["project_created"],
  artifact_uploaded: ["artifact_uploaded", "onboarding_artifact_uploaded"],
  digital_twin_loaded: ["digital_twin_loaded", "digital_twin.graph_revealed", "digital_twin.render_start"],
  roi_stage_calculated: ["roi_stage_calculated"],
  tcc_computed: ["tcc_computed"],
  mode_switch: ["mode_switch", "agent_mode_switch"],
  uxshell_view_selected: ["uxshell_view_selected", "uxshell_load_view"],
};

function parseArgs(argv) {
  const args = { project: null, since: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--project" && argv[i + 1]) {
      args.project = argv[i + 1];
      i += 1;
    } else if (arg === "--since" && argv[i + 1]) {
      const ts = Date.parse(argv[i + 1]);
      if (!Number.isNaN(ts)) {
        args.since = ts;
      }
      i += 1;
    }
  }
  return args;
}

function loadEvents() {
  if (!fs.existsSync(EVENTS_FILE)) {
    throw new Error(`Telemetry log missing at ${EVENTS_FILE}`);
  }
  const raw = fs.readFileSync(EVENTS_FILE, "utf8").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function filterEvents(events, projectId, sinceTs) {
  return events.filter((event) => {
    if (projectId) {
      const eventProject = event.data?.projectId ?? event.data?.project_id ?? event.projectId;
      if (eventProject !== projectId) return false;
    }
    if (sinceTs) {
      const eventTs = Date.parse(event.timestamp);
      if (!Number.isNaN(eventTs) && eventTs < sinceTs) return false;
    }
    return true;
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const events = filterEvents(loadEvents(), args.project, args.since);
  if (!events.length) {
    console.warn("⚠️  No events matched the supplied filters.");
  }

  const missing = REQUIRED_EVENTS.filter((eventType) => {
    const aliases = EVENT_ALIASES[eventType] ?? [eventType];
    return !aliases.some((alias) => events.some((event) => event.event_type === alias));
  });
  if (missing.length) {
    console.error("❌ Required telemetry events missing:");
    missing.forEach((eventType) => console.error(`  - ${eventType}`));
    process.exitCode = 1;
    return;
  }

  console.log("✅ Telemetry log contains required events:");
  REQUIRED_EVENTS.forEach((eventType) => console.log(`  • ${eventType}`));
  if (args.project) {
    console.log(`Project filter: ${args.project}`);
  }
  if (args.since) {
    console.log(`Since: ${new Date(args.since).toISOString()}`);
  }
}

main();
