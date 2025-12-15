import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DigitalEnterprisePage({ params }: PageProps): Promise<never> {
  const resolved = await params;
  const rawId = resolved?.id ?? "demo";
  const projectId = typeof rawId === "string" && rawId !== "undefined" ? rawId : "demo";
  redirect(`/project/${projectId}/experience?scene=digital`);
}
