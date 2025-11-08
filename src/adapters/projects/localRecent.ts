import type { ProjectsPort } from "@/domain/ports/projects";

const KEY = "fuxi:recent_projects";

export const localRecentProjects: ProjectsPort = {
  async listRecent() {
    if (typeof window === "undefined") return [];
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; }
    catch { return []; }
  },
  async pushRecent(id: string) {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [id, ...list.filter(x => x !== id)].slice(0, 6);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  },
};