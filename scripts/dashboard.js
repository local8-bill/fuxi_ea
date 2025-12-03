"use strict";

/**
 * Lightweight engineering dashboard
 * Sources:
 *  - Git: commit/merge/churn stats (last 30 days)
 *  - Telemetry: .fuxi/data/telemetry_events.ndjson (last 30 days)
 *  - CI: placeholder (extend if local artifacts are available)
 *
 * Output: docs/dashboard.md
 */

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const DAYS = 30;
const SINCE_ARG = `--since="${DAYS} days ago"`;
const DASHBOARD_PATH = path.join(__dirname, "..", "docs", "dashboard.md");
const TELEMETRY_PATH = path.join(__dirname, "..", ".fuxi", "data", "telemetry_events.ndjson");

function sh(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch (err) {
    return "";
  }
}

function formatNumber(n) {
  return n.toLocaleString();
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

function collectGitStats() {
  const commitsRaw = sh(`git log ${SINCE_ARG} --pretty=format:%H`);
  const commits = commitsRaw ? commitsRaw.split("\n").filter(Boolean) : [];

  const mergesRaw = sh(`git log ${SINCE_ARG} --merges --pretty=format:%H`);
  const merges = mergesRaw ? mergesRaw.split("\n").filter(Boolean) : [];

  const numstatRaw = sh(`git log ${SINCE_ARG} --numstat --pretty=format:"---%H|%ct"`);
  const lines = numstatRaw ? numstatRaw.split("\n") : [];

  let current = null;
  const commitsDetail = [];
  const churnByFile = new Map();

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("---")) {
      const [, rest] = line.split("---");
      const [hash, ts] = rest.split("|");
      if (current) commitsDetail.push(current);
      current = { hash, ts: Number(ts) * 1000, added: 0, deleted: 0 };
    } else {
      const parts = line.split("\t");
      if (parts.length >= 3 && current) {
        const added = parts[0] === "-" ? 0 : Number(parts[0]) || 0;
        const deleted = parts[1] === "-" ? 0 : Number(parts[1]) || 0;
        const file = parts[2];
        current.added += added;
        current.deleted += deleted;
        churnByFile.set(file, (churnByFile.get(file) || 0) + added + deleted);
      }
    }
  }
  if (current) commitsDetail.push(current);

  const totalAdded = commitsDetail.reduce((s, c) => s + c.added, 0);
  const totalDeleted = commitsDetail.reduce((s, c) => s + c.deleted, 0);
  const churnPerCommit = commitsDetail.map((c) => c.added + c.deleted).filter((n) => n > 0);
  const topFiles = Array.from(churnByFile.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([file, churn]) => ({ file, churn }));

  return {
    commits: commits.length,
    merges: merges.length,
    totalAdded,
    totalDeleted,
    churnMedian: churnPerCommit.length ? percentile(churnPerCommit, 50) : 0,
    churnP95: churnPerCommit.length ? percentile(churnPerCommit, 95) : 0,
    topFiles,
  };
}

function collectTelemetry() {
  if (!fs.existsSync(TELEMETRY_PATH)) {
    return { total: 0, errors: 0, byType: [], recent: [] };
  }
  const sinceMs = Date.now() - DAYS * 24 * 60 * 60 * 1000;
  const content = fs.readFileSync(TELEMETRY_PATH, "utf8");
  const lines = content.split("\n").filter(Boolean);

  let total = 0;
  let errors = 0;
  const byType = new Map();
  const recent = [];

  for (const line of lines) {
    try {
      const evt = JSON.parse(line);
      const ts = Date.parse(evt.timestamp || evt.time || 0);
      if (Number.isFinite(ts) && ts < sinceMs) continue;
      total += 1;
      const type = evt.event_type || evt.type || "unknown";
      byType.set(type, (byType.get(type) || 0) + 1);
      if (type.includes("error") || evt.error || (evt.data && evt.data.error)) errors += 1;
      if (recent.length < 5) {
        recent.push({
          timestamp: evt.timestamp,
          event_type: type,
          detail: evt.data ? JSON.stringify(evt.data).slice(0, 120) : "",
        });
      }
    } catch {
      // ignore malformed
    }
  }

  const byTypeList = Array.from(byType.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([event_type, count]) => ({ event_type, count }));

  return { total, errors, byType: byTypeList, recent };
}

function renderMarkdown(gitStats, telemetryStats) {
  const lines = [];
  lines.push("# Engineering Dashboard (last 30 days)");
  lines.push("");
  lines.push("## Delivery / Velocity");
  lines.push(`- Commits: **${formatNumber(gitStats.commits)}**`);
  lines.push(`- Merge commits: **${formatNumber(gitStats.merges)}**`);
  lines.push(`- Churn: **+${formatNumber(gitStats.totalAdded)} / -${formatNumber(gitStats.totalDeleted)}** lines`);
  lines.push(
    `- Churn per commit: median **${formatNumber(gitStats.churnMedian)}**, p95 **${formatNumber(gitStats.churnP95)}**`,
  );
  lines.push("");
  lines.push("Top changed files:");
  gitStats.topFiles.forEach((f) => lines.push(`- ${f.file}: ${formatNumber(f.churn)} lines touched`));
  if (!gitStats.topFiles.length) lines.push("- n/a");

  lines.push("");
  lines.push("## Quality / Telemetry");
  lines.push(`- Telemetry events: **${formatNumber(telemetryStats.total)}**, errors: **${formatNumber(telemetryStats.errors)}**`);
  lines.push("Top event types:");
  telemetryStats.byType.forEach((t) => lines.push(`- ${t.event_type}: ${formatNumber(t.count)}`));
  if (!telemetryStats.byType.length) lines.push("- n/a");

  lines.push("");
  lines.push("Recent events:");
  telemetryStats.recent.forEach((e) =>
    lines.push(`- ${e.timestamp || "n/a"} · ${e.event_type}${e.detail ? ` · ${e.detail}` : ""}`),
  );
  if (!telemetryStats.recent.length) lines.push("- n/a");

  lines.push("");
  lines.push("## Tests / CI");
  lines.push("- CI metrics not wired yet; add coverage/log parsing to scripts/dashboard.js to populate.");

  return lines.join("\n");
}

function main() {
  const gitStats = collectGitStats();
  const telemetryStats = collectTelemetry();
  const markdown = renderMarkdown(gitStats, telemetryStats);
  fs.mkdirSync(path.dirname(DASHBOARD_PATH), { recursive: true });
  fs.writeFileSync(DASHBOARD_PATH, markdown, "utf8");
  console.log(`Dashboard written to ${DASHBOARD_PATH}`);
}

if (require.main === module) {
  main();
}

