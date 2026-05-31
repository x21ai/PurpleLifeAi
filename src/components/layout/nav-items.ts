import { Sun, BookOpen, Clock, TrendingUp, Settings2, User, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/today" | "/journal" | "/timeline" | "/insights" | "/account" | "/tools" | "/settings";
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/insights", label: "Patterns", icon: TrendingUp },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/account", label: "Account", icon: User },
  { to: "/settings", label: "Settings", icon: Settings2 },
];