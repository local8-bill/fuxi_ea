"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SettingsPage() {
  const { id } = useParams() as { id: string };
  const [meta, setMeta] = useState<{ name: string; industry?: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(`fuxi:projects:${id}`);
    if (raw) {
      try {
        const proj = JSON.parse(raw);
        setMeta({ name: proj.meta?.name ?? "Untitled", industry: proj.meta?.industry });
      } catch {}
    }
  }, [id]);

  return (
    <div className="mx-auto max-w-[1100px] p-6 space-y-3">
      <h1 className="text-xl font-semibold">Settings</h1>
      {!meta ? (
        <div className="text-sm text-gray-500">Loading project…</div>
      ) : (
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Name:</span> {meta.name}</div>
          <div><span className="font-medium">Industry:</span> {meta.industry ?? "—"}</div>
          <div className="text-gray-500">Edit actions coming soon (rename, duplicate, delete, export).</div>
        </div>
      )}
    </div>
  );
}
