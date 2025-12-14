import { execSync } from "node:child_process";
import path from "node:path";

export const THEMES = ["zinc", "slate", "stone", "indigo", "sky", "neutral"] as const;

export async function applyTheme(theme: string) {
  if (!THEMES.includes(theme as (typeof THEMES)[number])) {
    throw new Error(`Unknown theme '${theme}'. Available: ${THEMES.join(", ")}`);
  }

  const configPath = path.resolve(process.cwd(), "tailwind.config.js");
  const sedCommand = `sed -i '' "s/primary: require('tailwindcss\\/colors').*,$/primary: require('tailwindcss\\/colors').${theme},/" ${configPath}`;
  execSync(sedCommand, { stdio: "inherit" });
  return theme;
}
