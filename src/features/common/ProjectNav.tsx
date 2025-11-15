"use client";

import Link from "next/link";
import React from "react";

type NavItem = {
  key: "scoring" | "modernization";
  label: string;
  href: (projectId: string) => string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "scoring", label: "Scoring", href: (id) => `/project/${id}/scoring` },
  { key: "modernization", label: "Modernization", href: (id) => `/project/${id}/modernization` },
];

type Props = {
  projectId: string;
  active: NavItem["key"];
};

export function ProjectNav({ projectId, active }: Props) {
  return (
    <nav className="rounded-3xl border border-gray-200 bg-white px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href(projectId)}
            className={`rounded-full px-3 py-1 transition ${
              active === item.key
                ? "bg-slate-900 text-white shadow"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
