#!/usr/bin/env node
/**
 * Command beans: quick reference for common dev commands.
 */
const beans = [
  { cmd: "npm run dev", desc: "Start Next.js dev server" },
  { cmd: "npm run build", desc: "Build for production" },
  { cmd: "npm run lint", desc: "Run eslint" },
  { cmd: "npm run test", desc: "Run vitest suite" },
  {
    cmd: "npm run dev:lan",
    desc: "Expose dev server on 0.0.0.0 for LAN testing (script auto-detects your IP and prints http://<LAN-IP>:3000; allow macOS firewall prompt if shown)",
  },
  { cmd: "npx playwright test --trace=on", desc: "Run Playwright E2E with trace/video" },
  { cmd: "npx playwright show-report", desc: "Open Playwright report" },
  { cmd: "npm run collect:videos", desc: "Copy Playwright videos into playwright-report/videos" },
  { cmd: "npm run dev:nuke", desc: "Kill cached builds (.next/.turbo) then start dev server fresh" },
  {
    cmd: "npm run dev:first",
    desc: "Reset home session + cached builds, then start dev server fresh (forces first-time onboarding)",
  },
  { cmd: "./scripts/list_routes.sh", desc: "Print common app routes" },
  {
    id: "generate_fuxi_brand_assets",
    cmd: "npm run generate:brand",
    desc: "Generate hand-drawn metallic Fuxi crowns (D077) and refresh manifest.",
    env: ["NODE_ENV=production"],
    outputs: ["/public/assets/brand/icons/manifest.json"],
  },
  {
    cmd: "node scripts/telemetry-summary.js",
    desc: "Print the latest telemetry events from .fuxi/data for quick troubleshooting.",
  },
  {
    cmd: "npm run verify:telemetry -- --project 700am",
    desc: "Ensure required D080 telemetry events (project_created → roi) exist in the NDJSON log.",
  },
  {
    cmd: "node scripts/dev/emit_test_events.js",
    desc: "Emit demo sequencer events to refresh adaptive learning metrics (D077C-A).",
  },
  {
    cmd: "node scripts/dev/compute_learning_metrics.js",
    desc: "Read the current demo learning metrics snapshot (confidence/velocity/maturity).",
  },
  {
    cmd: "npm run ingest:datadog [csv]",
    desc: "Normalize + seed Datadog service telemetry into ALE integration flows (D077B-II).",
  },
  {
    cmd: "npm run ingest:datadog:rollback",
    desc: "Remove Datadog-seeded integration flows from ALE provenance.",
  },
  {
    cmd: "bash scripts/ui_diff_capture.sh [/route]",
    desc: "Spin up baseline/current worktrees and capture before/after/diff screenshots (D086 graph prototype).",
    outputs: ["/playwright-report/ui-diff/<timestamp>-<name>-{before,after,diff}.png"],
  },
  {
    cmd: "node docs/features/d_086_b_graph_ux_task_runner.js --list",
    desc: "View/update the D086A sprint checklist (use --task/--complete to mark items).",
  },
  {
    cmd: "npm run snapshot:oms",
    desc: "Capture the latest OMS snapshot (D085H) into src/data/graph/snapshots/oms_<timestamp>.json.",
    outputs: ["/src/data/graph/snapshots/oms_<timestamp>.json", "/src/data/graph/snapshots/latest.json"],
  },
  {
    cmd: "npm run dev:focus",
    desc: "Launch Next.js with the graph prototype in focus-only mode (D086B).",
  },
  {
    cmd: "npm run dev:inspect:lane",
    desc: "Start dev server with inspector lane presets to debug right-rail UX (D086B).",
  },
  {
    cmd: "npm run dev:theme:verify",
    desc: "Validate graph prototype theme tokens and required selectors (D086B).",
  },
  {
    cmd: "npm run dev:scene-template",
    desc: "Run the standalone SceneLayout sandbox at /dev/scene-template (D087F).",
  },
];

console.log("🍛 Command beans (common dev commands):\n");
for (const bean of beans) {
  console.log(`- ${bean.cmd}: ${bean.desc}`);
  if (bean.env?.length) {
    console.log(`  env: ${bean.env.join(", ")}`);
  }
  if (bean.outputs?.length) {
    console.log(`  outputs: ${bean.outputs.join(", ")}`);
  }
  console.log();
}
