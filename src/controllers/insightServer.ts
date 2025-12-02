import fs from "fs/promises";
import path from "path";
import { computeInsights, getMockInsights } from "./insightController";
import type { Opportunity } from "@/domain/knowledge";

export async function persistInsights(data: Opportunity[]) {
  const dir = path.join(process.cwd(), ".fuxi", "data", "insights");
  const file = path.join(dir, "insight_results.json");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, JSON.stringify({ opportunities: data }, null, 2), "utf8");
}

async function readStoredInsights(): Promise<Opportunity[] | null> {
  const file = path.join(process.cwd(), ".fuxi", "data", "insights", "insight_results.json");
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return parsed.opportunities ?? null;
  } catch {
    return null;
  }
}

export async function loadInsightsServer(): Promise<Opportunity[]> {
  const stored = await readStoredInsights();
  if (stored?.length) return stored;
  return getMockInsights();
}

export async function computeAndPersist(inputs: any[]): Promise<Opportunity[]> {
  const ops = computeInsights(inputs, false);
  await persistInsights(ops);
  return ops;
}
