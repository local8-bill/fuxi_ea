"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tile = {
  title: string;
  bullets: string[];
  cta: string;
  href: string;
};



const TILE_DATA: Tile[] = [
  {
    title: "Capability Modeling",
    bullets: [
      "Define & import business capabilities",
      "Use AI to normalize & align",
      "Score & structure your capability map",
    ],
    cta: "Start Capability Modeling",
    href: "#", // no direct navigation for now
  },
  {
    title: "Technology Stack Modeling",
    bullets: [
      "Upload inventories & system diagrams",
      "Normalize applications using AI",
      "Build your technology estate",
    ],
    cta: "Start Tech Modeling",
    href: "#", // no direct navigation for now
  },
  {
    title: "Digital Enterprise View",
    bullets: [
      "Combined capability × tech intelligence",
      "Dependencies, risks, and redundancies",
      "Modernization insights & narratives",
    ],
    cta: "Enter Digital Enterprise",
    href: "#", // no direct navigation for now
  },
];

export default function StartPage() {
  const router = useRouter();
  const [project, setProject] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleLaunch = async () => {
    const trimmed = project.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a project name.");
      return;
    }
    setErrorMsg(null);
    try {
      await fetch("/api/projects/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: trimmed }),
      });
    } catch {
      // non-blocking; still navigate
    }
    router.push(`/project/${trimmed}/intake`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-slate-500">
            Welcome to
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">
            Fuxi — Enterprise Engine
          </h1>
          <p className="text-sm text-slate-500">
            Build your digital enterprise — one move at a time.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Open or Create a Project</p>
              <p className="text-xs text-slate-400">Enter a name and go.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-900 focus:outline-none"
                placeholder="Project name"
                value={project}
                onChange={(e) => setProject(e.target.value)}
              />
              <button className="btn btn-primary text-xs" onClick={handleLaunch}>
                Open Project
              </button>
            </div>
            {errorMsg && (
              <p className="mt-2 text-xs text-red-600">
                {errorMsg}
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {TILE_DATA.map((tile) => (
            <article
              key={tile.title}
              className="flex flex-col rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">{tile.title}</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {tile.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-900 mt-1" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <Link
                  href={tile.href}
                  className="inline-flex items-center justify-center rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                >
                  {tile.cta}
                </Link>
              </div>
            </article>
          ))}
        </section>

        {/* Junk drawer for unassociated routes (labs) */}
        <section className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-rose-500">Labs / Junk Drawer</p>
              <p className="text-xs text-rose-600">Quick links to standalone or experimental routes.</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Insights", href: "/insights" },
              { label: "Research", href: "/research" },
              { label: "Schema", href: "/schema" },
              { label: "Verification (demo)", href: "/project/demo/verification" },
              { label: "Scenario Studio (demo)", href: "/project/demo/scenario-studio" },
              { label: "Scoring (demo)", href: "/project/demo/scoring" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-rose-200 bg-white px-3 py-1 text-rose-700 hover:border-rose-400 hover:text-rose-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
