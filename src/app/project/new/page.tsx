"use client";

import React from "react";
import { useRouter } from "next/navigation";

// Local storage–based project registry (can swap with domain adapter later)
function getRecentProjects(): string[] {
  try {
    const raw = localStorage.getItem("fuxi:recent-projects");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecentProject(id: string) {
  try {
    const recents = getRecentProjects();
    const next = Array.from(new Set([id, ...recents])).slice(0, 5);
    localStorage.setItem("fuxi:recent-projects", JSON.stringify(next));
  } catch {}
}

export default function StartPage() {
  const router = useRouter();
  const [project, setProject] = React.useState("demo");
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    setRecent(getRecentProjects());
  }, []);

  const openProject = (id: string) => {
    if (!id) return;
    addRecentProject(id);
    router.push(`/project/${id}/scoring`);
  };

  const quickStarts = ["demo", "retail", "finance"];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Fuxi · Enterprise Engine</h1>
      <p className="text-slate-600 mb-8">
        Pick a project workspace or create a new one.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* --- Create / Open Project --- */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-2">Create or open a project</h2>
          <div className="flex gap-2 items-center mb-1">
            <input
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="input flex-1"
              placeholder="Enter project ID"
            />
            <button className="btn btn-primary" onClick={() => openProject(project)}>
              Open
            </button>
          </div>
          <p className="text-sm text-slate-500">
            This just namespaces your data for now.
          </p>
        </div>

        {/* --- Quick Start / Recent --- */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-2">Quick start</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {quickStarts.map((q) => (
              <button key={q} className="btn" onClick={() => openProject(q)}>
                {q}
              </button>
            ))}
          </div>

          <h3 className="text-lg font-semibold mb-2">Recent</h3>
          <div className="flex flex-wrap gap-2">
            {recent.length > 0 ? (
              recent.map((r) => (
                <button key={r} className="btn" onClick={() => openProject(r)}>
                  {r}
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent projects yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
