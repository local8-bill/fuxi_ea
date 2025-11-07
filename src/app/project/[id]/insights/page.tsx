"use client";
import { useParams } from "next/navigation";

export default function InsightsPage() {
  const { id } = useParams();
  return (
    <div className="mx-auto max-w-[1100px] p-6 space-y-2">
      <h1 className="text-xl font-semibold">Insights (placeholder)</h1>
      <p className="text-sm text-gray-600">Project ID: {String(id)}</p>
      <p className="text-sm text-gray-600">Charts and AI recommendations will render here.</p>
    </div>
  );
}
