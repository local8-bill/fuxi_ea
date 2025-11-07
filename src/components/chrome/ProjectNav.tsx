
"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const tabs = [
  { seg: "builder", label: "Builder" },
  { seg: "scoring", label: "Scoring" },
  { seg: "insights", label: "Insights" },
  { seg: "settings", label: "Settings" },
];

export default function ProjectNav() {
  const { id } = useParams() as { id: string };
  const pathname = usePathname();

  return (
    <div className="border-b bg-white">
      <div className="mx-auto flex max-w-[1100px] items-center gap-2 p-3">
        <div className="mr-2 text-sm font-semibold">Project</div>
        {tabs.map(({ seg, label }) => {
          const href = `/project/${id}/${seg}`;
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
    </div>
  );
}
