import type { Project, ProjectList } from "@/domain/model/project";

const KEY = "fuxi:projects";

function loadAll(): ProjectList {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProjectList) : [];
  } catch {
    return [];
  }
}

function saveAll(list: ProjectList) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export const projectsLocal = {
  list(): ProjectList {
    return loadAll();
  },
  get(id: string): Project | null {
    return loadAll().find((p) => p.id === id) ?? null;
  },
  create(name: string): Project {
    const id = slug(name);
    const now = new Date().toISOString();
    const all = loadAll();
    // dedupe id by suffixing a counter if needed
    let finalId = id;
    let n = 1;
    while (all.some((p) => p.id === finalId)) {
      finalId = `${id}-${n++}`;
    }
    const proj: Project = { id: finalId, name, createdAt: now };
    saveAll([...all, proj]);
    return proj;
  },
  remove(id: string) {
    saveAll(loadAll().filter((p) => p.id !== id));
    try {
      localStorage.removeItem(`fuxi:capabilities:${id}`);
      localStorage.removeItem(`fuxi:weights:${id}`);
    } catch {}
  },
};

function slug(s: string): string {
  const base = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return base || `project-${Math.random().toString(36).slice(2, 8)}`;
}