"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon?: string;
};

export function GlobalNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hideNav =
    searchParams?.get("embed") === "1" ||
    pathname?.startsWith("/dev/") ||
    pathname?.startsWith("/project/");

  if (hideNav) {
    return null;
  }

  // Try to extract /project/[id]/... from the current path
  let projectId: string | null = null;
  if (pathname) {
    const match = pathname.match(/^\/project\/([^/]+)/);
    if (match && match[1]) {
      projectId = decodeURIComponent(match[1]);
    }
  }
  if (!projectId) {
    const queryProject = searchParams?.get("project") ?? searchParams?.get("projectId");
    if (queryProject) {
      projectId = queryProject;
    }
  }
  if (!projectId && pathname?.startsWith("/dev/graph-prototype")) {
    projectId = "700am";
  }

  // Icons aligned with left-rail semantics
  const items: NavItem[] = projectId
    ? [
        { label: "Home", href: `/project/${projectId}/uxshell`, icon: "⌂" },
        { label: "Graph", href: `/project/${projectId}/graph`, icon: "∞" },
        { label: "ROI", href: `/project/${projectId}/roi-dashboard`, icon: "Σ" },
        { label: "Sequencer", href: `/project/${projectId}/sequencer`, icon: "⇄" },
        { label: "Digital Enterprise", href: `/project/${projectId}/digital-enterprise`, icon: "◆" },
      ]
    : [{ label: "Home", href: "/", icon: "⌂" }];

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-800">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-lg shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            ≡
          </button>
          Fuxi · Enterprise Engine
        </div>
        <div className="flex items-center gap-2">
          {items.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold shadow-sm ring-1 ring-slate-200 transition ${
                  isActive ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <span aria-hidden="true">{item.icon ?? "•"}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
