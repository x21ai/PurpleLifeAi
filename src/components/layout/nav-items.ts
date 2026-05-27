import { Sun, BookOpen, Clock, TrendingUp, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/today" | "/journal" | "/timeline" | "/insights" | "/settings";
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/insights", label: "Patterns", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings2 },
];