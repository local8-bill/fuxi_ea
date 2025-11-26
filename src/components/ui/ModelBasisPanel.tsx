"use client";

import React from "react";
import { getModelMetadata } from "@/lib/modelBasis";

type Props = {
  modelName: string;
  triggerLabel?: string;
};

export function ModelBasisPanel({ modelName, triggerLabel = "Model basis" }: Props) {
  const [open, setOpen] = React.useState(false);
  const meta = getModelMetadata(modelName);

  if (!meta) return null;

  return (
    <>
      <button
        className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
        onClick={() => setOpen(true)}
        type="button"
        aria-label={`Show basis for ${meta.modelName}`}
      >
        <span aria-hidden>ℹ️</span>
        {triggerLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200 p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Model Basis</p>
                <p className="text-lg font-semibold text-slate-900">{meta.modelName}</p>
                <p className="text-xs text-slate-500">{meta.modelType}</p>
              </div>
              <button className="text-sm text-slate-600 hover:text-slate-900" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <div className="text-sm text-slate-800">
              <p className="font-semibold">Purpose</p>
              <p className="text-slate-600">{meta.purpose}</p>
            </div>
            <div className="text-sm text-slate-800">
              <p className="font-semibold">Formula</p>
              <p className="text-slate-600">{meta.formulaSummary}</p>
            </div>
            <div className="text-sm text-slate-800">
              <p className="font-semibold">Inputs</p>
              <div className="flex flex-wrap gap-1 text-slate-600">
                {meta.inputs.map((i) => (
                  <span key={i} className="rounded-full bg-slate-100 px-2 py-1 text-xs border border-slate-200">
                    {i}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-sm text-slate-800">
              <p className="font-semibold">Assumptions</p>
              <ul className="list-disc pl-5 text-slate-600 space-y-1">
                {meta.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <span>Confidence: {meta.confidenceLevel}</span>
              {meta.lastUpdated && <span>Updated: {meta.lastUpdated}</span>}
              {meta.author && <span>Maintainer: {meta.author}</span>}
              {meta.referenceDocs && (
                <a className="text-indigo-600 hover:underline" href={meta.referenceDocs} target="_blank" rel="noreferrer">
                  Reference docs
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
