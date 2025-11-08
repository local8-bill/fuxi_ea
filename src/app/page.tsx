"use client";
import React from "react";
import Link from "next/link";
import { useStartPage } from "@/controllers/useStartPage";
import { localRecentProjects } from "@/adapters/projects/localRecent";

export default function ProjectStart() {
  const { pid, setPid, recent, open } = useStartPage(localRecentProjects);

  // Call our controller to record “recent”, then let Link do the navigation.
  async function record(id: string) {
    await open(id);
  }

  const target = `/project/${encodeURIComponent(pid || "demo")}/scoring`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-2">Fuxi • Capability Scoring</h1>
      <p className="text-slate-600 mb-8">Pick a project workspace or create a new one.</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-medium mb-2">Create or open a project</div>
          <div className="flex gap-2">
            <input
              className="input w-full"
              placeholder="e.g., demo, retail, finance, deckers"
              value={pid}
              onChange={(e) => setPid(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const id = (pid || "demo").trim();
                  await record(id);
                  // hard fallback in case JS routing is blocked
                  window.location.href = `/project/${encodeURIComponent(id)}/scoring`;
                }
              }}
            />
            <Link
              href={target}
              className="btn btn-primary"
              onClick={async (e) => {
                // make sure we record even if user Cmd+Clicks etc.
                const id = (pid || "demo").trim();
                await record(id);
              }}
            >
              Open
            </Link>
          </div>
          <div className="text-xs text-slate-500 mt-2">This just namespaces your data for now.</div>
        </div>

        <div className="card">
          <div className="font-medium mb-3">Quick start</div>
          <div className="flex flex-wrap gap-2">
            {["demo", "retail", "finance"].map((id) => (
              <Link
                key={id}
                href={`/project/${id}/scoring`}
                className="btn"
                onClick={() => record(id)}
              >
                {id}
              </Link>
            ))}
          </div>

          {recent.length > 0 && (
            <div className="mt-4">
              <div className="font-medium mb-2">Recent</div>
              <div className="flex flex-wrap gap-2">
                {recent.map((id) => (
                  <Link
                    key={id}
                    href={`/project/${encodeURIComponent(id)}/scoring`}
                    className="btn"
                    onClick={() => record(id)}
                  >
                    {id}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}