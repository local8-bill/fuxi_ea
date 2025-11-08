import type { Capability } from "@/domain/model/capability";
export interface StoragePort {
  load(projectId: string): Promise<Capability[]>;
  save(projectId: string, rows: Capability[]): Promise<void>;
  upsert(projectId: string, rows: Capability[]): Promise<void>;
}
