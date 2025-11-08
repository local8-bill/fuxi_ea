"use client";
import { useParams } from "next/navigation";

export default function BuilderPage() {
  const { id } = useParams();
  return (
    <div className="mx-auto max-w-[1100px] p-6 space-y-2">
      <h1 className="text-xl font-semibold">Visual Builder (placeholder)</h1>
      <p className="text-sm text-gray-600">Project ID: {String(id)}</p>
      <p className="text-sm text-gray-600">This will host the drag/drop capability map editor.</p>
    </div>
  );
}
