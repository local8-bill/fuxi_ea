#!/usr/bin/env node

const { execSync } = require("node:child_process");
const path = require("node:path");

const THEMES = ["zinc", "slate", "stone", "indigo", "sky", "neutral"];

function resolveTheme(args) {
  const baseFlag = args.indexOf("--base");
  if (baseFlag !== -1 && args[baseFlag + 1]) return args[baseFlag + 1];
  if (args.length) return args[0];
  return null;
}

function main() {
  const args = process.argv.slice(2);
  const theme = resolveTheme(args);
  if (!theme) {
    console.error(`Usage: npm run dev:theme -- --base <${THEMES.join("|")}>`);
    process.exit(1);
  }
  if (!THEMES.includes(theme)) {
    console.error(`Unknown theme '${theme}'. Available: ${THEMES.join(", ")}`);
    process.exit(1);
  }

  const configPath = path.resolve(process.cwd(), "tailwind.config.js");
  const sedCommand = `sed -i '' "s/primary: require('tailwindcss\\/colors').*,$/primary: require('tailwindcss\\/colors').${theme},/" ${configPath}`;

  console.log(`🎨 Applying theme '${theme}'`);
  execSync(sedCommand, { stdio: "inherit" });
  console.log("✅ Theme updated. Restart dev server to see changes.");
}

main();
