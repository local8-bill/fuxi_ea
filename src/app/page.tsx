"use client";
import React from "react";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Welcome</h1>
      <p className="text-sm text-slate-600">Start a new project to explore capability scoring.</p>
      <div className="flex gap-2">
        <a className="btn btn-primary" href="/new">Create Project</a>
      </div>
    </div>
  );
}
