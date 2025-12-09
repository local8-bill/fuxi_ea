"use server";

import fs from "node:fs/promises";
import path from "node:path";
import demoLearningPhrases from "@/lib/agent/responses/demo_learning.json";

const phrases: Record<string, string> = demoLearningPhrases;

const learningDir = path.join(process.cwd(), "data", "learning");
const metricsFile = path.join(learningDir, "demo_metrics.json");

type DemoMetrics = {
  confidence: number;
  velocity: number;
  maturity: number;
  updatedAt: string;
};

type MetricsStore = Record<string, DemoMetrics>;

async function ensureLearningDir() {
  await fs.mkdir(learningDir, { recursive: true });
}

async function loadMetricsStore(): Promise<MetricsStore> {
  try {
    const raw = await fs.readFile(metricsFile, "utf8");
    return JSON.parse(raw) as MetricsStore;
  } catch {
    return {};
  }
}

async function saveMetricsStore(store: MetricsStore) {
  await ensureLearningDir();
  await fs.writeFile(metricsFile, JSON.stringify(store, null, 2), "utf8");
}

export async function generateDemoMetrics(projectId: string): Promise<DemoMetrics> {
  await ensureLearningDir();
  const store = await loadMetricsStore();
  const metrics: DemoMetrics = {
    confidence: Number(Math.random().toFixed(2)),
    velocity: Number(Math.random().toFixed(2)),
    maturity: Number(Math.random().toFixed(2)),
    updatedAt: new Date().toISOString(),
  };
  store[projectId] = metrics;
  await saveMetricsStore(store);
  // eslint-disable-next-line no-console
  console.log(`[DEMO] Metrics for ${projectId}:`, metrics);
  return metrics;
}

export async function readDemoMetrics(projectId: string): Promise<DemoMetrics | null> {
  const store = await loadMetricsStore();
  return store[projectId] ?? null;
}

export async function getDemoLearningNarrative(projectId: string): Promise<string | null> {
  const metrics = await readDemoMetrics(projectId);
  if (!metrics) return null;

  if (metrics.velocity < 0.5 && phrases.velocity_down) {
    return phrases.velocity_down.replace("{{value}}", metrics.velocity.toFixed(2));
  }
  if (metrics.confidence > 0.7 && phrases.confidence_up) {
    return phrases.confidence_up.replace("{{value}}", metrics.confidence.toFixed(2));
  }
  if (metrics.maturity > 0.65 && phrases.maturity_up) {
    return phrases.maturity_up.replace("{{value}}", metrics.maturity.toFixed(2));
  }
  return null;
}
