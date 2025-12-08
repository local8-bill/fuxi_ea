"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SearchItem = {
  id: string;
  title: string;
  description: string;
  keywords?: string[];
  action: () => void;
};

interface SearchModalProps {
  open: boolean;
  initialQuery?: string;
  items: SearchItem[];
  onClose: () => void;
}

export function SearchModal({ open, initialQuery = "", items, onClose }: SearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 10);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => {
      if (item.title.toLowerCase().includes(normalized)) return true;
      if (item.description.toLowerCase().includes(normalized)) return true;
      return item.keywords?.some((keyword) => keyword.toLowerCase().includes(normalized));
    });
  }, [items, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/40 px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, views, or actions…"
            className="w-full border-none text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">No matches yet. Try a different phrase.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className="flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                    <span className="text-xs text-slate-500">{item.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
