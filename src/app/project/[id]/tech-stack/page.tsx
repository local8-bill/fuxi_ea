import type { ReactElement } from "react";
import { TechStackClient } from "./TechStackClient";

// Next 16: params is a Promise and must be awaited in server components.
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TechStackPage(
  { params }: PageProps
): Promise<ReactElement> {
  const resolved = await params;
  const rawId = resolved?.id;
  const projectId =
    typeof rawId === "string" && rawId !== "undefined" ? rawId : "";

  return <TechStackClient projectId={projectId} />;
}
