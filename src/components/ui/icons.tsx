"use client";

import type { LucideIcon } from "lucide-react";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Home,
  Lightbulb,
  Menu,
  Network,
  Search,
  Settings,
  SunMoon,
  TrendingUp,
  Workflow,
  X,
} from "lucide-react";

export type IconType = LucideIcon;

export const Icons = {
  menu: Menu,
  home: Home,
  graph: Network,
  sequencer: Workflow,
  roi: TrendingUp,
  insights: Lightbulb,
  intelligence: Brain,
  ale: Cpu,
  settings: Settings,
  theme: SunMoon,
  search: Search,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  close: X,
} as const;

export type IconName = keyof typeof Icons;
