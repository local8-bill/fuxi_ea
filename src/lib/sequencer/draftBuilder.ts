import { formatFiscalMonth, type StageWithTimeline } from "@/lib/sequencer/collisions";
import type { SequenceDraft, StageAwareness } from "@/lib/sequencer/types";

type DraftBuilderOptions = {
  projectId: string;
  sequence: {
    id: string;
    title: string;
    version?: string;
    fyStart?: string;
    fyEnd?: string;
  };
  stageMap: Map<string, StageWithTimeline>;
  awarenessByStageId: Map<string, StageAwareness>;
  regionScopeByStageId: Map<string, string[]>;
  brandScopeByStageId?: Map<string, string[]>;
  channelScopeByStageId?: Map<string, string[]>;
  intentTagsByStageId?: Map<string, string[]>;
  provenance?: Array<{ sourceType: string; sourceRef?: string; note?: string }>;
};

export function buildSequenceDraft(opts: DraftBuilderOptions): SequenceDraft {
  const { sequence, stageMap, awarenessByStageId, regionScopeByStageId } = opts;
  const version = sequence.version ?? "static-seed";
  const now = new Date().toISOString();
  const stages = Array.from(stageMap.values()).map((stage) => {
    const durationMonths = Math.max(1, stage.endIndex - stage.startIndex + 1);
    const regionScope = regionScopeByStageId.get(stage.stageId) ?? [];
    const awareness = awarenessByStageId.get(stage.stageId);
    return {
      stageId: stage.stageId,
      title: stage.title,
      waveLabel: stage.waveLabel,
      startLabel: formatFiscalMonth(stage.startIndex),
      durationMonths,
      systemsTouched: stage.systemsTouched ?? [],
      integrationsTouched: stage.integrationsTouched ?? [],
      domainsTouched: stage.domainsTouched ?? [],
      regionScope,
      brandScope: opts.brandScopeByStageId?.get(stage.stageId),
      channelScope: opts.channelScopeByStageId?.get(stage.stageId),
      intentTags: opts.intentTagsByStageId?.get(stage.stageId),
      targets: undefined,
      provenance: [
        {
          sourceType: "import",
          sourceRef: `sequence:${sequence.id}`,
          note: `Loaded from static modernization pack (${version})`,
        },
      ],
      awareness: awareness ?? fallbackAwareness(),
    };
  });

  return {
    projectId: opts.projectId,
    sequenceId: sequence.id,
    name: sequence.title,
    version,
    createdAt: now,
    updatedAt: now,
    fyStart: sequence.fyStart,
    fyEnd: sequence.fyEnd,
    stageCount: stages.length,
    stages,
    provenance: opts.provenance,
  };
}

function fallbackAwareness(): StageAwareness {
  return {
    blastRadius: { dependencyLoad: 0, criticalityWeight: 0 },
    coupling: { financial: false, inventory: false, fulfillment: false, dataContract: false },
    constraints: { blackout: false, governanceGate: false, rfpDependency: false },
    storeFootprint: { storesCount: 0, countriesCount: 0, brandsCount: 0 },
    riskFlags: [],
    confidence: { overall: 0.3, byField: {} },
  };
}
