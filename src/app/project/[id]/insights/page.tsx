import { redirect } from "next/navigation";

export default function ProjectInsightsPage({ params }: { params: { id: string } }) {
  redirect(`/project/${params.id}/experience?scene=insights`);
}
