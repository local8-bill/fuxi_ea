import { promises as fs } from "node:fs";
import path from "node:path";

type ClassificationDefinition = {
  name: string;
  description: string;
  risk_weight: number;
  sequencer_wave: number;
  roi_focus: string;
  telemetry_tag: string;
};

type ClassificationSchema = {
  version: string;
  defaultMix: Record<string, number>;
  classifications: ClassificationDefinition[];
};

type ProjectClassificationRecord = {
  system: string;
  classification: string;
};

const SCHEMA_PATH = path.join(process.cwd(), "data", "inventory", "schema", "app_inventory_v2.json");
const PROJECT_DATA_DIR = path.join(process.cwd(), ".fuxi", "data", "inventory");

let cachedSchema: ClassificationSchema | null = null;

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error?.code !== "ENOENT") {
      console.warn("[classification] failed to read %s", filePath, error);
    }
    return null;
  }
}

async function ensureSchema(): Promise<ClassificationSchema> {
  if (cachedSchema) return cachedSchema;
  const schema = await readJsonFile<ClassificationSchema>(SCHEMA_PATH);
  if (schema) {
    cachedSchema = schema;
    return schema;
  }
  const fallback: ClassificationSchema = {
    version: "2.0",
    defaultMix: {
      "Global Strategic Platform": 0.4,
      "Standard Platform": 0.4,
      "Competitive Advantage Platform": 0.2,
    },
    classifications: [
      {
        name: "Global Strategic Platform",
        description: "Fallback strategic platform definition",
        risk_weight: 1,
        sequencer_wave: 1,
        roi_focus: "Resilience",
        telemetry_tag: "strategic",
      },
      {
        name: "Standard Platform",
        description: "Fallback standard platform definition",
        risk_weight: 0.7,
        sequencer_wave: 2,
        roi_focus: "Efficiency",
        telemetry_tag: "standard",
      },
      {
        name: "Competitive Advantage Platform",
        description: "Fallback competitive platform definition",
        risk_weight: 0.5,
        sequencer_wave: 3,
        roi_focus: "Growth",
        telemetry_tag: "advantage",
      },
    ],
  };
  cachedSchema = fallback;
  return fallback;
}

export async function getClassificationDefinitions() {
  const schema = await ensureSchema();
  const map = new Map<string, ClassificationDefinition>();
  schema.classifications.forEach((def) => map.set(def.name, def));
  return map;
}

async function readProjectClassificationFile(projectId: string): Promise<ProjectClassificationRecord[] | null> {
  const safeId = projectId.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase() || "default";
  const filePath = path.join(PROJECT_DATA_DIR, `${safeId}_classification.json`);
  return readJsonFile<ProjectClassificationRecord[]>(filePath);
}

export async function getClassificationMix(projectId: string): Promise<Record<string, number>> {
  const schema = await ensureSchema();
  const definitions = await getClassificationDefinitions();
  const projectData = (await readProjectClassificationFile(projectId)) ?? [];

  if (projectData.length === 0) {
    return schema.defaultMix;
  }

  const counts = new Map<string, number>();
  projectData.forEach((row) => {
    const name = row.classification?.trim();
    if (!name || !definitions.has(name)) return;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  const total = Array.from(counts.values()).reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    return schema.defaultMix;
  }

  const mix: Record<string, number> = {};
  counts.forEach((value, key) => {
    mix[key] = value / total;
  });

  schema.classifications.forEach((def) => {
    if (mix[def.name] == null && schema.defaultMix[def.name] != null) {
      mix[def.name] = 0;
    }
  });

  return mix;
}

export async function getRiskModifier(projectId: string): Promise<number> {
  const definitions = await getClassificationDefinitions();
  const mix = await getClassificationMix(projectId);
  const modifier = Object.entries(mix).reduce((sum, [name, weight]) => {
    const def = definitions.get(name);
    const riskWeight = def?.risk_weight ?? 1;
    return sum + weight * riskWeight;
  }, 0);
  return modifier || 1;
}

export async function deriveWaveTarget(projectId: string): Promise<number> {
  const definitions = await getClassificationDefinitions();
  const mix = await getClassificationMix(projectId);
  const weighted = Object.entries(mix).reduce((sum, [name, weight]) => {
    const def = definitions.get(name);
    const wave = def?.sequencer_wave ?? 2;
    return sum + weight * wave;
  }, 0);
  if (!weighted) return 3;
  return Math.max(1, Math.round(weighted));
}

export async function getClassificationSummary(projectId: string) {
  const schema = await ensureSchema();
  const mix = await getClassificationMix(projectId);
  return {
    mix,
    definitions: schema.classifications,
  };
}
