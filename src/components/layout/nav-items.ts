import { Sun, BookOpen, Clock, TrendingUp, Settings2, User, Wrench, Droplets } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/today" | "/journal" | "/timeline" | "/insights" | "/account" | "/tools" | "/settings" | "/hydration";
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/hydration", label: "Hydration", icon: Droplets },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/insights", label: "Patterns", icon: TrendingUp },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/account", label: "Account", icon: User },
  { to: "/settings", label: "Settings", icon: Settings2 },
];