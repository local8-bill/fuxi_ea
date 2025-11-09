export interface Project {
  id: string;          // slug/uuid
  name: string;        // user-facing
  createdAt: string;   // ISO
}

export type ProjectList = Project[];