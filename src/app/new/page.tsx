"use client";
import React from "react";

export default function NewProjectPage() {
  function useBaseline() {
    const id = Math.random().toString(36).slice(2, 8);
    const meta = { id, name: "Untitled Project" };
    const payload = { meta };
    localStorage.setItem(`fuxi:projects:${id}`, JSON.stringify(payload));
    const idxRaw = localStorage.getItem("fuxi:projects:index");
    const idx = idxRaw ? JSON.parse(idxRaw) : [];
    localStorage.setItem("fuxi:projects:index", JSON.stringify([meta, ...idx]));
    window.location.href = `/project/${id}/scoring`;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create a New Project</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button className="card text-left hover:bg-slate-50" onClick={useBaseline}>
          <div className="font-medium">Start Empty</div>
          <div className="text-xs text-slate-600">Blank project with Deckers baseline data</div>
        </button>
        <a className="card text-left hover:bg-slate-50 pointer-events-none opacity-60">
          <div className="font-medium">Upload Map</div>
          <div className="text-xs text-slate-600">Image/PDF → interpreted draft (soon)</div>
        </a>
        <a className="card text-left hover:bg-slate-50 pointer-events-none opacity-60">
          <div className="font-medium">AI Suggest</div>
          <div className="text-xs text-slate-600">Industry baseline (soon)</div>
        </a>
      </div>
    </div>
  );
}
