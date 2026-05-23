import { Home, BookOpen, MessageCircle, Pill, Sparkles, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/" | "/journal" | "/chat" | "/meds" | "/insights" | "/settings";
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { to: "/", label: "Today", icon: Home },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/meds", label: "Meds", icon: Pill },
  { to: "/insights", label: "Insights", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];