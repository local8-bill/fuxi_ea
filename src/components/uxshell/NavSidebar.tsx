"use client";

import { useRouter } from "next/navigation";
import { NavSection } from "./NavSection";
import { useChevronNav } from "@/hooks/useChevronNav";
import { PlusIcon, SumIcon, FlowIcon, CheckIcon, InfinityIcon } from "./NavIcons";

const sections = [
  {
    title: "ROI",
    icon: <SumIcon />,
    items: [
      { label: "ROI 1 (Hypothesis)", path: "/roi-dashboard" },
      { label: "ROI 2 (Actuals)", path: "/roi-dashboard?mode=actuals" },
      { label: "ROI 3 (Scenario B)", path: "/roi-dashboard?mode=scenario-b" },
      { label: "+ New ROI", path: "/roi-dashboard?new=true" },
    ],
  },
  {
    title: "Graph",
    icon: <PlusIcon />,
    items: [{ label: "Digital Enterprise", path: "/digital-enterprise" }],
  },
  {
    title: "Sequencer",
    icon: <FlowIcon />,
    items: [{ label: "Transformation", path: "/transformation-dialogue" }],
  },
  {
    title: "Review",
    icon: <CheckIcon />,
    items: [{ label: "Harmonization Review", path: "/harmonization-review" }],
  },
  {
    title: "Digital Enterprise",
    icon: <InfinityIcon />,
    items: [{ label: "Systems View", path: "/digital-enterprise" }],
  },
];

export function NavSidebar({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { expanded, activeItem, toggleSection, selectItem } = useChevronNav(projectId);

  const handleSelect = (section: string, path: string) => {
    selectItem(section, path);
    const href = `/project/${projectId}${path}`;
    router.push(href);
  };

  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <NavSection
          key={s.title}
          title={s.title}
          icon={s.icon}
          items={s.items.map((i) => ({
            ...i,
            isActive: activeItem === i.path,
            onClick: () => handleSelect(s.title, i.path),
          }))}
          isExpanded={expanded === s.title}
          onToggle={toggleSection}
        />
      ))}
    </div>
  );
}
