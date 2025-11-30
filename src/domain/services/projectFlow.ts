import fs from "node:fs/promises";
import path from "node:path";
import { harmonizeSystems } from "./harmonization";
import { appendFile } from "node:fs/promises";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const PROJECTS_ROOT = path.join(DATA_ROOT, "projects");
const INGESTED_ROOT = path.join(DATA_ROOT, "ingested");
const TELEMETRY_FILE = path.join(DATA_ROOT, "telemetry_events.ndjson");

type StepStatus = "active" | "complete";

export type ProjectState = {
  projectId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  lastStep?: string;
  steps: Record<
    string,
    {
      status: StepStatus;
      updatedAt: string;
    }
  >;
};

export async function initProject(projectId?: string, metadata?: Record<string, unknown>) {
  const id = projectId || `proj-${Date.now()}`;
  const root = path.join(PROJECTS_ROOT, id);
  await fs.mkdir(path.join(root, "ingested"), { recursive: true });
  await fs.mkdir(path.join(root, "harmonized"), { recursive: true });
  await fs.mkdir(path.join(root, "decisions"), { recursive: true });

  const projectFile = path.join(root, "project.json");
  let state: ProjectState | null = null;
  try {
    const raw = await fs.readFile(projectFile, "utf8");
    state = JSON.parse(raw) as ProjectState;
  } catch {
    state = {
      projectId: id,
      createdAt: new Date().toISOString(),
      metadata,
      steps: {},
    };
    await fs.writeFile(projectFile, JSON.stringify(state, null, 2), "utf8");
  }
  return { projectId: id, root, state };
}

export async function updateProjectStep(projectId: string, step: string, status: StepStatus) {
  const root = path.join(PROJECTS_ROOT, projectId);
  const projectFile = path.join(root, "project.json");
  let state: ProjectState | null = null;
  try {
    const raw = await fs.readFile(projectFile, "utf8");
    state = JSON.parse(raw) as ProjectState;
  } catch {
    state = {
      projectId,
      createdAt: new Date().toISOString(),
      steps: {},
    };
  }
  const updatedAt = new Date().toISOString();
  state.steps = state.steps || {};
  state.steps[step] = { status, updatedAt };
  state.lastStep = step;
  await fs.writeFile(projectFile, JSON.stringify(state, null, 2), "utf8");
  return state;
}

export async function maybeAutoHarmonize(projectId: string) {
  // Auto-harmonization triggers when any ingested artifact exists.
  const hasArtifacts = await artifactsExist();
  if (!hasArtifacts) return null;
  await harmonizeSystems({ mode: "all" });
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  await fs.mkdir(path.join(projectRoot, "harmonized"), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, "harmonized", "last_auto_run.txt"),
    `auto-harmonized ${new Date().toISOString()}`,
    "utf8",
  );
  await appendTelemetry({
    workspace_id: "digital_enterprise",
    event_type: "harmonization_auto_complete",
    data: { project_id: projectId },
  });
  return true;
}

async function artifactsExist(): Promise<boolean> {
  try {
    const files = await fs.readdir(INGESTED_ROOT);
    return files.length > 0;
  } catch {
    return false;
  }
}

type ArtifactResult = { ok: boolean; file: string; error?: string };

export async function autoIngestArtifacts(projectId: string): Promise<ArtifactResult[]> {
  const results: ArtifactResult[] = [];
  try {
    const files = await fs.readdir(INGESTED_ROOT);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".pdf" || ext === ".png") {
        try {
          const outDir = path.join(PROJECTS_ROOT, projectId, "ingested");
          await fs.mkdir(outDir, { recursive: true });
          const jsonOut = path.join(outDir, `${path.basename(file, ext)}.json`);
          const payload = {
            source: file,
            extracted: true,
            note: "Placeholder extraction for PDF/PNG",
            ts: new Date().toISOString(),
          };
          await fs.writeFile(jsonOut, JSON.stringify(payload, null, 2), "utf8");
          results.push({ ok: true, file });
          await appendTelemetry({
            workspace_id: "tech_stack",
            event_type: "artifact_extracted",
            data: { project_id: projectId, file, ext },
          });
        } catch (err: any) {
          results.push({ ok: false, file, error: err?.message });
          await appendTelemetry({
            workspace_id: "tech_stack",
            event_type: "artifact_failed",
            data: { project_id: projectId, file, error: err?.message },
          });
        }
      }
    }
  } catch {
    return results;
  }
  return results;
}

async function appendTelemetry(event: { workspace_id: string; event_type: string; data?: Record<string, unknown> }) {
  try {
    await fs.mkdir(path.dirname(TELEMETRY_FILE), { recursive: true });
    const payload = {
      session_id: "server",
      workspace_id: event.workspace_id,
      event_type: event.event_type,
      timestamp: new Date().toISOString(),
      data: event.data,
    };
    await appendFile(TELEMETRY_FILE, JSON.stringify(payload) + "\n", "utf8");
  } catch {
    // ignore
  }
}
