"use server";

import fs from "fs/promises";
import path from "path";
import type { RoiAssumptions, RoiFeasibilityReport, RoiTargets } from "@/lib/roi/types";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const ROI_TARGETS_FILE = path.join(DATA_ROOT, "roi", "targets.ndjson");
const ROI_ASSUMPTIONS_FILE = path.join(DATA_ROOT, "roi", "assumptions.ndjson");
const ROI_FEASIBILITY_FILE = path.join(DATA_ROOT, "roi", "feasibility.ndjson");

async function appendJsonLine(filePath: string, payload: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
}

async function readJsonLines<T>(filePath: string): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

export async function persistRoiTargets(payload: RoiTargets) {
  await appendJsonLine(ROI_TARGETS_FILE, payload);
}

export async function persistRoiAssumptions(payload: RoiAssumptions) {
  await appendJsonLine(ROI_ASSUMPTIONS_FILE, payload);
}

export async function persistRoiFeasibilityReport(payload: RoiFeasibilityReport) {
  await appendJsonLine(ROI_FEASIBILITY_FILE, payload);
}

export async function listRoiTargets(projectId?: string) {
  const entries = await readJsonLines<RoiTargets>(ROI_TARGETS_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listRoiAssumptions(projectId?: string) {
  const entries = await readJsonLines<RoiAssumptions>(ROI_ASSUMPTIONS_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listRoiFeasibilityReports(projectId?: string) {
  const entries = await readJsonLines<RoiFeasibilityReport>(ROI_FEASIBILITY_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}
