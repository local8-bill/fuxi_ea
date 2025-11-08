"use client";

import React from "react";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-5xl flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Fuxi</h1>
          <nav className="space-x-4 text-sm">
            <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
            <a href="/new" className="text-gray-900 font-medium">New Project</a>
            <a href="/new/suggest" className="text-gray-600 hover:text-gray-900">AI Suggest</a>
            <a href="/import" className="text-gray-600 hover:text-gray-900">Import</a>
          </nav>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="text-3xl font-bold mb-3">Create a New Project</h2>
        <p className="text-gray-600 mb-8">
          Choose how you want to start your capability model.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <a
            href="/new/suggest"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="text-lg font-medium mb-1">AI Suggest</div>
            <div className="text-sm text-gray-600">Pick an industry → get a baseline model</div>
          </a>

        <a
            href="/import"
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="text-lg font-medium mb-1">Upload Map</div>
            <div className="text-sm text-gray-600">Image or PDF → interpreted capability draft</div>
          </a>

          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-100 p-5 text-gray-400 text-sm text-center cursor-not-allowed">
            <div className="font-medium text-gray-500 mb-1">Build From Scratch</div>
            <div>Visual editor (coming soon)</div>
          </div>
        </div>

        <p className="mt-10 text-sm text-gray-500">
          💡 Tip: You can edit or extend any baseline before saving it.
        </p>
      </main>
    </div>
  );
}