"use client";
import * as React from "react";
import type { ProjectsPort } from "@/domain/ports/projects";

export function useStartPage(projects: ProjectsPort) {
  const [pid, setPid] = React.useState("demo");
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => { projects.listRecent().then(setRecent); }, [projects]);

  async function open(raw: string) {
    const id = (raw || "demo").trim() || "demo";
    await projects.pushRecent(id);
    return id;
  }

  return { pid, setPid, recent, open };
}