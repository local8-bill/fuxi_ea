import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ROIRedirectPage({ params }: PageProps) {
  const resolved = await params;
  const rawId = resolved?.id ?? "demo";
  const projectId = typeof rawId === "string" && rawId !== "undefined" ? rawId : "demo";
  redirect(`/project/${projectId}/experience?scene=roi`);
}
