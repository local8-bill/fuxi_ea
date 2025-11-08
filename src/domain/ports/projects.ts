export interface ProjectsPort {
  listRecent(): Promise<string[]>;
  pushRecent(id: string): Promise<void>;
}