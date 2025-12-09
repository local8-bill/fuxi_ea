#!/usr/bin/env node
const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const SESSION_FILE = path.join(DATA_ROOT, "sessions", "home.json");

async function main() {
  try {
    await fs.unlink(SESSION_FILE);
    console.log(`[dev:first] cleared ${SESSION_FILE}`);
  } catch (error) {
    if (error?.code === "ENOENT") {
      console.log("[dev:first] session file already clean");
      return;
    }
    console.warn(`[dev:first] failed to clear session file: ${error?.message ?? error}`);
  }
}

main();
