import type { ReactElement } from "react";
import { DigitalEnterpriseClient } from "./DigitalEnterpriseClient";

// Next 16: params is a Promise and must be awaited.
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DigitalEnterprisePage(
  { params }: PageProps
): Promise<ReactElement> {
  const resolved = await params;
  const rawId = resolved?.id;
  const projectId =
    typeof rawId === "string" && rawId !== "undefined" ? rawId : "";

  return <DigitalEnterpriseClient projectId={projectId} />;
}
