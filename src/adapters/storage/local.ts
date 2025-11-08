import type { StoragePort } from "@/domain/ports/storage";
import type { Capability } from "@/domain/model/capability";

const KEY = (p: string) => `fuxi:capabilities:${p}`;

export const localStorageAdapter: StoragePort = {
  async load(projectId) {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(KEY(projectId));
    return raw ? (JSON.parse(raw) as Capability[]) : [];
  },
  async save(projectId, rows) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY(projectId), JSON.stringify(rows));
  },
  async upsert(projectId, rows) {
    if (typeof window === "undefined") return;
    const existing = await this.load(projectId);
    const byId = new Map(existing.map(r => [r.id, r]));
    rows.forEach(r => byId.set(r.id, r));
    await this.save(projectId, Array.from(byId.values()));
  },
};
