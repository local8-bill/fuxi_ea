
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/new", label: "New Project" },
  { href: "/new/suggest", label: "AI Suggest" },
  { href: "/import", label: "Import" },
];

export default function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center gap-2 p-3">
        <div className="mr-2 text-sm font-semibold">Fuxi</div>
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-1.5 text-sm hover:bg-gray-50 ${active ? "bg-gray-100 font-medium" : ""}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
