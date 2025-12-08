#!/usr/bin/env node

const path = require("node:path");
process.env.TS_NODE_PROJECT = path.join(process.cwd(), "tsconfig.scripts.json");
const Module = require("module");
require("ts-node/register/transpile-only");
require("tsconfig-paths/register");
const baseAlias = path.join(process.cwd(), "src");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function patched(request, parent, isMain, options) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const resolved = path.join(baseAlias, request.slice(2));
    return originalResolve.call(this, resolved, parent, isMain, options);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

const { runSequencerEvent } = require("../../src/lib/sequencer/engine");

async function main() {
  await runSequencerEvent("sequencer_action_confirmed", { project_id: "deckers", wave: 1 });
  await runSequencerEvent("sequencer_timeline_shifted", { project_id: "deckers", wave: 2 });
  await runSequencerEvent("sequencer_dependency_blocked", { project_id: "deckers", wave: 3 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
