"use client";

import { useParams } from "next/navigation";
import { UnifiedLayout } from "@/components/uxshell/UnifiedLayout";
import "@/styles/uxshell.css";

export default function ProjectDashboardPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? "unknown";
  return <UnifiedLayout projectId={projectId} />;
}
