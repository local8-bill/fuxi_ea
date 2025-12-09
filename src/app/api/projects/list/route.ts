import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const DATA_ROOT = process.env.FUXI_DATA_ROOT ?? path.join(process.cwd(), ".fuxi", "data");
const PROJECTS_ROOT = path.join(DATA_ROOT, "projects");

type ProjectListItem = {
  id: string;
  name: string;
  status?: string;
};

const FALLBACK_PROJECTS: ProjectListItem[] = [
  { id: "700am", name: "700am — Core", status: "LIVE" },
  { id: "951pm", name: "951pm — Pilot", status: "DRAFT" },
  { id: "demo", name: "Demo Workspace", status: "DEMO" },
];

async function loadProjects(): Promise<ProjectListItem[]> {
  const items: ProjectListItem[] = [];
  try {
    const dirs = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
    for (const entry of dirs) {
      if (!entry.isDirectory()) continue;
      const id = entry.name;
      try {
        const projectFile = path.join(PROJECTS_ROOT, id, "project.json");
        const raw = await fs.readFile(projectFile, "utf8");
        const json = JSON.parse(raw) as { projectId?: string; metadata?: Record<string, unknown> };
        const name = typeof json?.metadata?.name === "string" && json.metadata.name.trim().length ? (json.metadata.name as string) : id;
        items.push({ id, name });
      } catch {
        items.push({ id, name: id });
      }
    }
  } catch {
    // ignore
  }
  const merged = [...items];
  for (const fallback of FALLBACK_PROJECTS) {
    if (!merged.some((item) => item.id === fallback.id)) {
      merged.push(fallback);
    }
  }
  merged.sort((a, b) => a.name.localeCompare(b.name));
  return merged;
}

export async function GET() {
  const projects = await loadProjects();
  return NextResponse.json({ ok: true, projects });
}
