#!/usr/bin/env node
/**
 * Command beans: quick reference for common dev commands.
 */
const beans = [
  { cmd: "npm run dev", desc: "Start Next.js dev server" },
  { cmd: "npm run build", desc: "Build for production" },
  { cmd: "npm run lint", desc: "Run eslint" },
  { cmd: "npm run test", desc: "Run vitest suite" },
  { cmd: "npx playwright test --trace=on", desc: "Run Playwright E2E with trace/video" },
  { cmd: "npx playwright show-report", desc: "Open Playwright report" },
  { cmd: "npm run collect:videos", desc: "Copy Playwright videos into playwright-report/videos" },
  { cmd: "npm run dev:nuke", desc: "Kill cached builds (.next/.turbo) then start dev server fresh" },
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
];

console.log("🍛 Command beans (common dev commands):\n");
for (const bean of beans) {
  console.log(`- ${bean.cmd}`);
  console.log(`  ${bean.desc}`);
  if (bean.env?.length) {
    console.log(`  env: ${bean.env.join(", ")}`);
  }
  if (bean.outputs?.length) {
    console.log(`  outputs: ${bean.outputs.join(", ")}`);
  }
  console.log();
}
