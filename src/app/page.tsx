"use client";

import React, { useEffect, useState } from "react";

type Meta = { id: string; name: string; industry?: string; createdAt?: string };

export default function Home() {
  const [recent, setRecent] = useState<Meta[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fuxi:projects:index");
      setRecent(raw ? JSON.parse(raw) : []);
    } catch {
      setRecent([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* 🔶 DEBUG BANNER: if you see this, the STYLED home is active */}
      <div className="bg-yellow-200 text-yellow-900 px-4 py-2 text-sm text-center">
        STYLED HOME ACTIVE
      </div>
      <div className="testbox">Plain CSS works?</div>

      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="text-xl font-semibold">Fuxi</div>
          <nav className="text-sm space-x-4">
            <a href="/" className="text-gray-900 font-medium">Home</a>
            <a href="/new" className="text-gray-600 hover:text-gray-900">New Project</a>
            <a href="/new/suggest" className="text-gray-600 hover:text-gray-900">AI Suggest</a>
            <a href="/import" className="text-gray-600 hover:text-gray-900">Import</a>
          </nav>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Fuxi</h1>
          <p className="text-gray-600">
            Create a project or open an existing one to start modeling and scoring capabilities.
          </p>
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <a href="/new" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="text-lg font-medium mb-1">New Project</div>
            <div className="text-sm text-gray-600">Start from scratch or a template</div>
          </a>
          <a href="/new/suggest" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="text-lg font-medium mb-1">AI Suggest</div>
            <div className="text-sm text-gray-600">Pick industry → draft baseline</div>
          </a>
          <a href="/import" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition">
            <div className="text-lg font-medium mb-1">Import</div>
            <div className="text-sm text-gray-600">Upload image/PDF → interpreted draft</div>
          </a>
        </div>

        {/* Recent projects */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          {recent.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-gray-500">
              No recent projects yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((m) => (
                <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.name ?? "Untitled Project"}</div>
                    <div className="text-xs text-gray-500">
                      {m.industry ?? "—"}{m.createdAt ? ` • ${new Date(m.createdAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                  <a
                    href={`/project/${m.id}/scoring`}
                    className="inline-flex items-center px-3 py-2 rounded-lg bg-teal-700 text-white text-sm hover:bg-teal-800"
                  >
                    Open
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}