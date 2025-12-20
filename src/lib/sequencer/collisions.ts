import { STAGE_DEFINITIONS, type SequencerStage, type SequencerStageSet } from "@/data/sequences/stageIndex";

export type SequenceLike = {
  id: string;
  fyStart: string;
  fyEnd: string;
  scenarios: Array<{ id: string; title: string }>;
};

export type StageWithTimeline = SequencerStage & {
  stageId: string;
  title: string;
  waveLabel: string;
  startIndex: number;
  endIndex: number;
};

export type CollisionSeverity = "low" | "medium" | "high";

export type CollisionRule =
  | "sharedIntegrationOverlap"
  | "sharedCriticalSystemOverlap"
  | "sharedSystemOverlap"
  | "sharedDomainOverlap";

export type Collision = {
  aStageId: string;
  bStageId: string;
  overlap: {
    fyStart: string;
    fyEnd: string;
  };
  sharedSystems: string[];
  sharedIntegrations: string[];
  sharedDomains: string[];
  severity: CollisionSeverity;
  qualificationRules: CollisionRule[];
};

export type CollisionReport = {
  collisions: Collision[];
  collisionsByStageId: Record<string, Collision[]>;
  topConflicts: Array<{ stageId: string; count: number }>;
};

export type CollisionContext = {
  stages: StageWithTimeline[];
  stageMap: Map<string, StageWithTimeline>;
  report: CollisionReport | null;
};

const SEVERITY_ORDER: Record<CollisionSeverity, number> = { high: 3, medium: 2, low: 1 };

export function buildCollisionContext(sequence: SequenceLike | null): CollisionContext | null {
  if (!sequence || !Array.isArray(sequence.scenarios) || !sequence.scenarios.length) {
    return null;
  }
  const stageSet = STAGE_DEFINITIONS[sequence.id];
  const bands = buildFiscalBands(sequence.fyStart, sequence.fyEnd, sequence.scenarios.length);
  const stages = sequence.scenarios.map((scenario, index) => {
    const definition = stageSet?.stages.find((stage) => stage.id === scenario.id);
    return withTimeline(definition, scenario, {
      waveLabel: bands[index] ?? `${sequence.fyStart} Wave ${index + 1}`,
      fallbackStartIndex: createFallbackStartIndex(sequence.fyStart, index),
    });
  });
  const stageMap = new Map<string, StageWithTimeline>();
  stages.forEach((stage) => {
    stageMap.set(stage.stageId, stage);
  });
  const report = definitionHasDetailedData(stageSet) ? detectCollisions(stages) : null;
  if (report && report.collisions.length && typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const table = report.collisions.map((collision) => {
      const aStage = stageMap.get(collision.aStageId);
      const bStage = stageMap.get(collision.bStageId);
      return {
        stageA: aStage?.title ?? collision.aStageId,
        stageB: bStage?.title ?? collision.bStageId,
        overlap: `${collision.overlap.fyStart} – ${collision.overlap.fyEnd}`,
        sharedSystems: collision.sharedSystems.length,
        sharedIntegrations: collision.sharedIntegrations.length,
        sharedDomains: collision.sharedDomains.length,
        severity: collision.severity,
      };
    });
    console.table(table);
  }
  return { stages, stageMap, report };
}

export function detectCollisions(stages: StageWithTimeline[]): CollisionReport {
  const collisions: Collision[] = [];
  const collisionsByStageId: Record<string, Collision[]> = {};
  for (let i = 0; i < stages.length; i += 1) {
    for (let j = i + 1; j < stages.length; j += 1) {
      const a = stages[i];
      const b = stages[j];
      if (!doStagesOverlap(a, b)) continue;
      const sharedSystems = intersectStrings(a.systemsTouched, b.systemsTouched);
      const sharedIntegrations = intersectStrings(a.integrationsTouched, b.integrationsTouched);
      const sharedDomains = intersectStrings(a.domainsTouched, b.domainsTouched);
      if (!sharedSystems.length && !sharedIntegrations.length && !sharedDomains.length) continue;
      const hasCriticalOverlap = sharedSystems.some((system) => (a.criticalSystems ?? []).includes(system) || (b.criticalSystems ?? []).includes(system));
      const qualificationRules: CollisionRule[] = [];
      if (sharedIntegrations.length) {
        qualificationRules.push("sharedIntegrationOverlap");
      }
      if (hasCriticalOverlap) {
        qualificationRules.push("sharedCriticalSystemOverlap");
      } else if (sharedSystems.length) {
        qualificationRules.push("sharedSystemOverlap");
      }
      if (sharedDomains.length) {
        qualificationRules.push("sharedDomainOverlap");
      }
      const severity = resolveSeverity(sharedSystems, sharedIntegrations, a, b, hasCriticalOverlap);
      const overlapRange = buildOverlapRange(a, b);
      const collision: Collision = {
        aStageId: a.stageId,
        bStageId: b.stageId,
        overlap: overlapRange,
        sharedSystems,
        sharedIntegrations,
        sharedDomains,
        severity,
        qualificationRules,
      };
      collisions.push(collision);
      collisionsByStageId[a.stageId] = [...(collisionsByStageId[a.stageId] ?? []), collision];
      collisionsByStageId[b.stageId] = [...(collisionsByStageId[b.stageId] ?? []), collision];
    }
  }
  const topConflicts = Object.entries(collisionsByStageId)
    .map(([stageId, list]) => ({ stageId, count: list.length }))
    .sort((a, b) => b.count - a.count);
  return { collisions, collisionsByStageId, topConflicts };
}

export function definitionHasDetailedData(stageSet?: SequencerStageSet): boolean {
  if (!stageSet) return false;
  return stageSet.stages.some((stage) => Boolean(stage.systemsTouched?.length || stage.integrationsTouched?.length));
}

function withTimeline(
  definition: SequencerStage | undefined,
  scenario: { id: string; title: string },
  ctx: { waveLabel: string; fallbackStartIndex: number },
): StageWithTimeline {
  const base: SequencerStage = definition ?? {
    id: scenario.id,
    title: scenario.title,
    waveId: ctx.waveLabel,
  };
  const startIndex = resolveMonthIndex(base.fyStart, base.startMonth, ctx.fallbackStartIndex);
  const endIndex = resolveMonthIndex(base.fyEnd ?? base.fyStart, base.endMonth ?? base.startMonth, startIndex + 2);
  return {
    ...base,
    stageId: scenario.id,
    title: base.title ?? scenario.title,
    waveLabel: ctx.waveLabel,
    startIndex: Math.min(startIndex, endIndex),
    endIndex: Math.max(startIndex, endIndex),
    systemsTouched: base.systemsTouched ?? [],
    integrationsTouched: base.integrationsTouched ?? [],
    domainsTouched: base.domainsTouched ?? [],
    criticalSystems: base.criticalSystems ?? [],
  };
}

function resolveMonthIndex(fyLabel: string | undefined, month: number | undefined, fallback: number): number {
  const year = parseFiscalYear(fyLabel) ?? Math.floor(fallback / 12);
  const safeMonth = month && month >= 1 && month <= 12 ? month : (fallback % 12) + 1;
  return year * 12 + (safeMonth - 1);
}

function createFallbackStartIndex(fyLabel: string, position: number): number {
  const baseYear = parseFiscalYear(fyLabel) ?? 2026;
  const baseMonth = (position % 4) * 3 + 1;
  return baseYear * 12 + (baseMonth - 1);
}

function parseFiscalYear(label?: string): number | null {
  if (!label) return null;
  const match = label.match(/FY(\d{2})/i);
  if (!match) return null;
  const twoDigit = Number(match[1]);
  return 2000 + twoDigit;
}

function buildFiscalBands(start: string, end: string, desiredLength: number): string[] {
  const startYear = parseFiscalYear(start) ?? 0;
  const endYear = parseFiscalYear(end) ?? startYear;
  if (!startYear || !endYear) return Array.from({ length: desiredLength }, (_, idx) => `${start} · Wave ${idx + 1}`);
  const years: number[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }
  const bands: string[] = [];
  const repeats = Math.ceil(desiredLength / years.length);
  for (let r = 0; r < repeats; r += 1) {
    years.forEach((year) => {
      if (bands.length < desiredLength) {
        const waveNumber = bands.length + 1;
        bands.push(`FY${String(year).slice(-2)} Wave ${waveNumber}`);
      }
    });
  }
  return bands;
}

function doStagesOverlap(a: StageWithTimeline, b: StageWithTimeline): boolean {
  return a.startIndex <= b.endIndex && b.startIndex <= a.endIndex;
}

function intersectStrings(a?: string[], b?: string[]): string[] {
  if (!a?.length || !b?.length) return [];
  const setB = new Set(b);
  return a.filter((item) => setB.has(item));
}

function resolveSeverity(
  sharedSystems: string[],
  sharedIntegrations: string[],
  a: StageWithTimeline,
  b: StageWithTimeline,
  hasCriticalOverlap?: boolean,
): CollisionSeverity {
  const criticalSet = new Set([...(a.criticalSystems ?? []), ...(b.criticalSystems ?? [])]);
  if (sharedIntegrations.length) return "high";
  if (typeof hasCriticalOverlap === "boolean" ? hasCriticalOverlap : sharedSystems.some((system) => criticalSet.has(system))) return "high";
  if (sharedSystems.length) return "medium";
  return "low";
}

function buildOverlapRange(a: StageWithTimeline, b: StageWithTimeline): { fyStart: string; fyEnd: string } {
  const overlapStart = Math.max(a.startIndex, b.startIndex);
  const overlapEnd = Math.min(a.endIndex, b.endIndex);
  return {
    fyStart: formatFiscalMonth(overlapStart),
    fyEnd: formatFiscalMonth(overlapEnd),
  };
}

export function formatFiscalMonth(index: number): string {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return `FY${String(year).slice(-2)} · M${month}`;
}

export function highestSeverity(collisions: Collision[]): CollisionSeverity | null {
  if (!collisions.length) return null;
  const sorted = [...collisions].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
  return sorted[0]?.severity ?? null;
}

export function getSeverityLabel(severity: CollisionSeverity | null): string {
  if (!severity) return "";
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
