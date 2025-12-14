const fs = require("node:fs");
const path = require("node:path");

const cssPath = path.join(__dirname, "..", "..", "src", "app", "globals.css");

try {
  const css = fs.readFileSync(cssPath, "utf8");
  const requiredTokens = [".graph-prototype-theme", "[data-phase-pill]", "[data-region-chip]", "[data-telemetry-panel]"];
  const missing = requiredTokens.filter((token) => !css.includes(token));
  if (missing.length) {
    console.error(`❌ Theme verification failed. Missing selectors: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("✅ Graph prototype theme tokens verified.");
} catch (error) {
  console.error("❌ Unable to verify theme tokens:", error);
  process.exit(1);
}
