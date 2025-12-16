import { Suspense, type ReactElement } from "react";
import { ExperienceClient } from "@/components/experience/ExperienceClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExperiencePage({ params }: PageProps): Promise<ReactElement> {
  const resolved = await params;
  const rawId = resolved?.id ?? "demo";
  const projectId = typeof rawId === "string" && rawId !== "undefined" ? rawId : "demo";
  return (
    <Suspense fallback={null}>
      <ExperienceClient projectId={projectId} />
    </Suspense>
  );
}
