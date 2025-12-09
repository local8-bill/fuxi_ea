#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const projectId = process.argv[2] ?? "deckers";
const memoryFile = path.join(process.cwd(), "data", "learning", "memoryCache.json");

function readSnapshot() {
  if (!fs.existsSync(memoryFile)) return null;
  try {
    const store = JSON.parse(fs.readFileSync(memoryFile, "utf8"));
    return store[projectId] ?? null;
  } catch (err) {
    console.error("Failed to read learning snapshot", err);
    return null;
  }
}

const snapshot = readSnapshot();
if (!snapshot) {
  console.log(`No learning metrics recorded for ${projectId} yet.`);
  process.exit(0);
}

console.log({ projectId, ...snapshot });
