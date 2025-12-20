"use server";

import fs from "fs/promises";
import path from "path";
import type {
  CalibrationEvent,
  ConflictSet,
  DecisionLogEntry,
  RefinementLogEntry,
  RoleReviewFeedback,
  RoleReviewRun,
  RiskPostureSample,
  ScenarioDraft,
  SequenceDraft,
  SequenceSnapshot,
} from "@/lib/sequencer/types";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const SCENARIO_DRAFTS_FILE = path.join(DATA_ROOT, "scenarios", "drafts.ndjson");
const SEQUENCE_DRAFTS_FILE = path.join(DATA_ROOT, "sequences", "drafts.ndjson");
const REFINEMENT_LOG_FILE = path.join(DATA_ROOT, "sequences", "refinement-log.ndjson");
const CONFLICT_SET_FILE = path.join(DATA_ROOT, "sequences", "conflicts.ndjson");
const CALIBRATION_EVENTS_FILE = path.join(DATA_ROOT, "sequences", "calibration-events.ndjson");
const RISK_POSTURE_FILE = path.join(DATA_ROOT, "sequences", "risk-posture.ndjson");
const ROLE_REVIEW_RUNS_FILE = path.join(DATA_ROOT, "sequences", "role-review-runs.ndjson");
const ROLE_REVIEW_FEEDBACK_FILE = path.join(DATA_ROOT, "sequences", "role-review-feedback.ndjson");
const DECISION_LOG_FILE = path.join(DATA_ROOT, "sequences", "decision-log.ndjson");
const SEQUENCE_SNAPSHOTS_FILE = path.join(DATA_ROOT, "sequences", "snapshots.ndjson");

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

export async function persistScenarioDraft(draft: ScenarioDraft) {
  await appendJsonLine(SCENARIO_DRAFTS_FILE, { ...draft, saved_at: new Date().toISOString() });
}

export async function persistSequenceDraft(draft: SequenceDraft) {
  await appendJsonLine(SEQUENCE_DRAFTS_FILE, { ...draft, saved_at: new Date().toISOString() });
}

export async function persistRefinementLogEntry(entry: RefinementLogEntry) {
  await appendJsonLine(REFINEMENT_LOG_FILE, entry);
}

export async function persistConflictSet(payload: ConflictSet) {
  await appendJsonLine(CONFLICT_SET_FILE, payload);
}

export async function persistCalibrationEvent(payload: CalibrationEvent) {
  await appendJsonLine(CALIBRATION_EVENTS_FILE, payload);
}

export async function persistRiskPostureSample(payload: RiskPostureSample) {
  await appendJsonLine(RISK_POSTURE_FILE, payload);
}

export async function persistRoleReviewRun(payload: RoleReviewRun) {
  await appendJsonLine(ROLE_REVIEW_RUNS_FILE, payload);
}

export async function persistRoleReviewFeedback(payload: RoleReviewFeedback) {
  await appendJsonLine(ROLE_REVIEW_FEEDBACK_FILE, payload);
}

export async function persistDecisionLogEntry(payload: DecisionLogEntry) {
  await appendJsonLine(DECISION_LOG_FILE, payload);
}

export async function persistSequenceSnapshot(payload: SequenceSnapshot) {
  await appendJsonLine(SEQUENCE_SNAPSHOTS_FILE, payload);
}

export async function listCalibrationEvents(projectId?: string) {
  const entries = await readJsonLines<CalibrationEvent>(CALIBRATION_EVENTS_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listScenarioDrafts(projectId?: string) {
  const entries = await readJsonLines<ScenarioDraft>(SCENARIO_DRAFTS_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listSequenceDrafts(projectId?: string) {
  const entries = await readJsonLines<SequenceDraft>(SEQUENCE_DRAFTS_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listRefinementLogEntries(projectId?: string) {
  const entries = await readJsonLines<RefinementLogEntry>(REFINEMENT_LOG_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listConflictSets(projectId?: string) {
  const entries = await readJsonLines<ConflictSet>(CONFLICT_SET_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listRiskPostureSamples(projectId?: string) {
  const entries = await readJsonLines<RiskPostureSample>(RISK_POSTURE_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listRoleReviewRuns(projectId?: string) {
  const entries = await readJsonLines<RoleReviewRun>(ROLE_REVIEW_RUNS_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listRoleReviewFeedback(projectId?: string) {
  const entries = await readJsonLines<RoleReviewFeedback>(ROLE_REVIEW_FEEDBACK_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listDecisionLogEntries(projectId?: string) {
  const entries = await readJsonLines<DecisionLogEntry>(DECISION_LOG_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}

export async function listSequenceSnapshots(projectId?: string) {
  const entries = await readJsonLines<SequenceSnapshot>(SEQUENCE_SNAPSHOTS_FILE);
  if (!projectId) return entries;
  return entries.filter((entry) => entry.projectId === projectId);
}
