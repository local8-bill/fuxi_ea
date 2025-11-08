'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectStart() {
  const r = useRouter();
  const [pid, setPid] = React.useState<string>('demo');
  const [recent, setRecent] = React.useState<string[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('fuxi:recent_projects');
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  function open(id: string) {
    const norm = id.trim() || 'demo';
    try {
      const raw = localStorage.getItem('fuxi:recent_projects');
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [norm, ...list.filter(x => x !== norm)].slice(0, 6);
      localStorage.setItem('fuxi:recent_projects', JSON.stringify(next));
    } catch {}
    r.push(`/project/${encodeURIComponent(norm)}/scoring`);
  }

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
              onChange={(e)=>setPid(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter') open(pid); }}
            />
            <button className="btn btn-primary" onClick={()=>open(pid)}>Open</button>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            This just namespaces your data for now. We’ll wire persistence later.
          </div>
        </div>

        <div className="card">
          <div className="font-medium mb-3">Quick start</div>
          <div className="flex flex-wrap gap-2">
            {['demo','retail','finance'].map(id => (
              <button key={id} className="btn" onClick={()=>open(id)}>{id}</button>
            ))}
          </div>

          {recent.length > 0 && (
            <div className="mt-4">
              <div className="font-medium mb-2">Recent</div>
              <div className="flex flex-wrap gap-2">
                {recent.map(id => (
                  <button key={id} className="btn" onClick={()=>open(id)}>{id}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-6">
        <div className="font-medium mb-2">Tips</div>
        <ul className="list-disc ml-5 text-sm text-slate-600 space-y-1">
          <li>Use <span className="font-mono">Sort: Score</span> to prioritize by composite score.</li>
          <li>Toggle <span className="font-mono">Weights</span> to change priorities on the fly.</li>
          <li>Open any card to edit scores; enable <span className="font-mono">Override</span> for explicit control.</li>
        </ul>
      </div>
    </div>
  );
}
