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
  { cmd: "./scripts/list_routes.sh", desc: "Print common app routes" }
];

console.log("🍛 Command beans (common dev commands):\n");
for (const bean of beans) {
  console.log(`- ${bean.cmd}`);
  console.log(`  ${bean.desc}\n`);
}
