"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

export function GlobalNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (searchParams?.get("embed") === "1") {
    return null;
  }

  // Try to extract /project/[id]/... from the current path
  let projectId: string | null = null;
  if (pathname) {
    const match = pathname.match(/^\/project\/([^\/]+)/);
    if (match && match[1]) {
      projectId = decodeURIComponent(match[1]);
    }
  }

  const items: NavItem[] = [
    { label: "Home", href: "/" },
  ];

  if (projectId) {
    items.push(
      {
        label: "Capabilities",
        href: `/project/${projectId}/scoring`,
      },
      {
        label: "Tech Stack",
        href: `/project/${projectId}/tech-stack`,
      },
      {
        label: "Digital Enterprise",
        href: `/project/${projectId}/digital-enterprise`,
      },
    );
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold tracking-wide text-slate-800">
          Fuxi · Enterprise Engine
        </div>
        <div className="flex items-center gap-3 text-xs">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full px-3 py-1.5 transition",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
