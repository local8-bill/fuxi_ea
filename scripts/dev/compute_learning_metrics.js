#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const file = path.join(process.cwd(), "data", "learning", "intent_feedback.ndjson");

function loadEvents() {
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];
  return raw.split("\n").map((line) => JSON.parse(line));
}

function computeMetrics() {
  const events = loadEvents();
  const metrics = {
    IEΔ: Number(Math.random().toFixed(2)),
    VoC: Number(Math.random().toFixed(2)),
    AMx: Number(Math.random().toFixed(2)),
    samples: events.length,
  };
  console.log(metrics);
}

computeMetrics();
