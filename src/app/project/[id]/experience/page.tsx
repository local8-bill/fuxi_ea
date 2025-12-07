import type { ReactElement } from "react";
import { ExperienceShell } from "@/components/experience/ExperienceShell";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExperiencePage({ params }: PageProps): Promise<ReactElement> {
  const resolved = await params;
  const rawId = resolved?.id ?? "demo";
  const projectId = typeof rawId === "string" && rawId !== "undefined" ? rawId : "demo";
  return <ExperienceShell projectId={projectId} />;
}
