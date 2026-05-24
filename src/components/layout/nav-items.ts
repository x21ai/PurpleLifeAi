import { Sun, BookOpen, MessageCircle, TrendingUp, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/" | "/journal" | "/chat" | "/insights" | "/settings";
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { to: "/", label: "Today", icon: Sun },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/chat", label: "Ask", icon: MessageCircle },
  { to: "/insights", label: "Patterns", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: Settings2 },
];