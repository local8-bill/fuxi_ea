"use server";

import {
  listCalibrationEvents,
  listRiskPostureSamples,
  persistCalibrationEvent,
  persistConflictSet,
  persistRiskPostureSample,
} from "@/lib/sequencer/storage";
import type { CalibrationEvent, ConflictSet, RiskPostureSample } from "@/lib/sequencer/types";

export async function recordConflictSet(payload: ConflictSet) {
  await persistConflictSet(payload);
}

export async function recordCalibrationEvent(payload: CalibrationEvent) {
  await persistCalibrationEvent(payload);
}

export async function recordRiskPostureSample(payload: RiskPostureSample) {
  await persistRiskPostureSample(payload);
}

export async function fetchCalibrationEvents(projectId?: string) {
  return listCalibrationEvents(projectId);
}

export async function fetchRiskPostureHistory(projectId?: string) {
  return listRiskPostureSamples(projectId);
}
