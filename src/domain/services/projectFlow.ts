import fs from "node:fs/promises";
import path from "node:path";
import { harmonizeSystems } from "./harmonization";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const PROJECTS_ROOT = path.join(DATA_ROOT, "projects");

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
  // Basic auto-harmonization: if both current/future CSV exist, run harmonizeSystems.
  const ingestedRoot = path.join(DATA_ROOT, "ingested");
  const currentCsv = path.join(ingestedRoot, "enterprise_current_state.csv");
  const futureCsv = path.join(ingestedRoot, "enterprise_future_state.csv");
  try {
    await fs.access(currentCsv);
    await fs.access(futureCsv);
  } catch {
    return null;
  }

  await harmonizeSystems({ mode: "all" });
  // Write a simple marker
  const projectRoot = path.join(PROJECTS_ROOT, projectId);
  await fs.mkdir(path.join(projectRoot, "harmonized"), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, "harmonized", "last_auto_run.txt"),
    `auto-harmonized ${new Date().toISOString()}`,
    "utf8",
  );
  return true;
}
