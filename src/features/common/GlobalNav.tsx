"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const NAV_ITEMS = [
  { label: "Projects", href: "/project" },
  { label: "Capabilities", href: "/project/demo/scoring" },
  { label: "Tech Stack", href: "/project/demo/modernization" },
  { label: "Digital Enterprise", href: "/digital-enterprise" },
];

export function GlobalNav() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 text-sm font-medium text-slate-600">
        <span className="text-lg font-semibold text-slate-900">Fuxi</span>
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-full px-3 py-1 transition ${
                active
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
