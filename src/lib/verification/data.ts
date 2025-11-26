"use server";

import fs from "fs/promises";
import path from "path";

export type DirectiveMeta = {
  id: string;
  title: string;
  description?: string;
  status?: "complete" | "in_progress" | "at_risk" | "unknown";
  file: string;
  lastUpdated?: string;
};

export type TestResult = {
  suite: string;
  status: "pass" | "fail" | "unknown";
  runAt?: string;
  details?: string;
};

export type HealthSummary = {
  buildStatus: "pass" | "fail" | "unknown";
  directiveCount: number;
  completedCount: number;
  testsPassing: number;
  testsTotal: number;
};

function safeStatusFromText(text: string): DirectiveMeta["status"] {
  if (!text) return "unknown";
  const t = text.toLowerCase();
  if (t.includes("✅") || t.includes("complete")) return "complete";
  if (t.includes("⚠") || t.includes("risk")) return "at_risk";
  if (t.includes("in progress") || t.includes("draft") || t.includes("todo")) return "in_progress";
  return "unknown";
}

async function readDirectiveFiles(): Promise<DirectiveMeta[]> {
  const dir = path.join(process.cwd(), "docs", "features");
  const files = await fs.readdir(dir);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  const results: DirectiveMeta[] = [];

  for (const file of mdFiles) {
    try {
      const full = path.join(dir, file);
      const content = await fs.readFile(full, "utf8");
      const lines = content.split(/\r?\n/);
      const titleLine = lines.find((l) => l.startsWith("#")) ?? file;
      const description =
        lines.find((l) => l.toLowerCase().startsWith("### purpose")) ??
        lines.find((l) => l.toLowerCase().startsWith("purpose")) ??
        "";

      const statusLine = lines.find((l) => l.toLowerCase().includes("status"));
      const status = safeStatusFromText(statusLine ?? "");
      const idMatch = titleLine.match(/(D\d{3}|Directive\s*\d{3})/i);
      const id = idMatch ? idMatch[1].replace(/Directive\s*/i, "D") : file.replace(".md", "");

      results.push({
        id,
        title: titleLine.replace(/^#+\s*/, "").trim(),
        description: description.replace(/^#+\s*/i, "").trim(),
        status,
        file: path.join("docs/features", file),
      });
    } catch {
      // skip unreadable files
    }
  }
  return results.sort((a, b) => a.id.localeCompare(b.id));
}

async function readTestResults(): Promise<TestResult[]> {
  const dir = path.join(process.cwd(), "tests", "results");
  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));
    const results: TestResult[] = [];
    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(dir, file), "utf8");
      const data = JSON.parse(content);
      const suites: any[] = Array.isArray(data) ? data : data.suites ?? [];
      suites.forEach((s) =>
        results.push({
          suite: s.name ?? file,
          status: s.status ?? "unknown",
          runAt: s.runAt,
          details: s.summary ?? undefined,
        }),
      );
    }
    return results;
  } catch {
    return [];
  }
}

export async function loadVerificationData() {
  const directives = await readDirectiveFiles();
  const tests = await readTestResults();

  const completedCount = directives.filter((d) => d.status === "complete").length;
  const testsPassing = tests.filter((t) => t.status === "pass").length;
  const summary: HealthSummary = {
    buildStatus: "unknown",
    directiveCount: directives.length,
    completedCount,
    testsPassing,
    testsTotal: tests.length,
  };

  return { directives, tests, summary };
}
