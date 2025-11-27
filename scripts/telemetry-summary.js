#!/usr/bin/env node

/**
 * Summarize recent telemetry events from .fuxi/data/telemetry_events.ndjson
 * Outputs counts by workspace and event type, plus session duration estimates.
 */

const fs = require("fs");
const path = require("path");

const EVENTS_FILE = path.join(process.cwd(), ".fuxi", "data", "telemetry_events.ndjson");

function readEvents() {
  if (!fs.existsSync(EVENTS_FILE)) {
    console.error("No telemetry file found:", EVENTS_FILE);
    return [];
  }
  const raw = fs.readFileSync(EVENTS_FILE, "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim())
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

function summarize(events) {
  const byWorkspace = {};
  const bySession = {};

  for (const ev of events) {
    const ws = ev.workspace_id || "unknown";
    const sess = ev.session_id || "unknown";
    const ts = ev.timestamp ? Date.parse(ev.timestamp) : undefined;
    const type = ev.event_type || "unknown";

    byWorkspace[ws] ??= { total: 0, types: {} };
    byWorkspace[ws].total += 1;
    byWorkspace[ws].types[type] = (byWorkspace[ws].types[type] || 0) + 1;

    bySession[sess] ??= { first: ts, last: ts, count: 0, workspaces: new Set() };
    bySession[sess].count += 1;
    if (ts) {
      if (!bySession[sess].first || ts < bySession[sess].first) bySession[sess].first = ts;
      if (!bySession[sess].last || ts > bySession[sess].last) bySession[sess].last = ts;
    }
    bySession[sess].workspaces.add(ws);
  }

  const sessions = Object.entries(bySession).map(([id, meta]) => {
    const durationMs =
      meta.first && meta.last ? Math.max(0, meta.last - meta.first) : undefined;
    return {
      session: id,
      events: meta.count,
      duration_s: durationMs ? Math.round(durationMs / 1000) : null,
      workspaces: Array.from(meta.workspaces),
    };
  });

  return { byWorkspace, sessions };
}

function printSummary(summary) {
  console.log("Telemetry Summary");
  console.log("=================");
  const wsEntries = Object.entries(summary.byWorkspace);
  if (!wsEntries.length) {
    console.log("No events found.");
    return;
  }
  for (const [ws, meta] of wsEntries) {
    console.log(`\nWorkspace: ${ws}`);
    console.log(`  Total events: ${meta.total}`);
    console.log("  Event types:");
    for (const [type, count] of Object.entries(meta.types)) {
      console.log(`    - ${type}: ${count}`);
    }
  }

  console.log("\nSessions:");
  for (const sess of summary.sessions) {
    console.log(
      `  ${sess.session}: events=${sess.events}, duration_s=${sess.duration_s ?? "n/a"}, workspaces=${sess.workspaces.join(",")}`,
    );
  }
}

function main() {
  const events = readEvents();
  const summary = summarize(events);
  printSummary(summary);
}

main();
