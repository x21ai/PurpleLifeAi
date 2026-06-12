import {
  Sun,
  BookOpen,
  Clock,
  TrendingUp,
  Settings2,
  User,
  Wrench,
  Droplets,
  HeartPulse,
  MessageCircle,
  Users,
  Activity,
  Pill,
  FileText,
  Bolt,
  Plane,
  Globe,
  Shield,
  Dna,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PlatformFlags } from "@/lib/platform-flags";

/**
 * Sidebar nav model.
 * Top-level entries can either link directly (no `children`) or act as
 * collapsible group headers (with `children`). Mobile bottom nav uses the
 * flat `navItems` projection below to stay compact.
 */
export type NavLeaf = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Direct link target when there are no children. */
  to?: string;
  children?: NavLeaf[];
};

export const navTree: NavGroup[] = [
  { id: "today", label: "Today", icon: Sun, to: "/today" },
  { id: "journal", label: "Journal", icon: BookOpen, to: "/journal" },
  {
    id: "body",
    label: "My Body",
    icon: HeartPulse,
    to: "/my-health",
    children: [
      { to: "/biometrics", label: "Biometrics", icon: Activity },
      { to: "/hydration", label: "Intake", icon: Droplets },
      { to: "/meds", label: "Medications", icon: Pill },
      { to: "/timeline", label: "Timeline", icon: Clock },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    icon: TrendingUp,
    to: "/insights",
    children: [
      { to: "/reports", label: "Reports", icon: FileText },
      { to: "/my-health-dna", label: "DNA", icon: Dna },
    ],
  },
  {
    id: "care",
    label: "Care",
    icon: Users,
    to: "/care",
    children: [{ to: "/chat-care", label: "Messages", icon: MessageCircle }],
  },
  { id: "community", label: "Community", icon: Globe, to: "/community" },
  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    to: "/tools",
    children: [
      { to: "/apple-health-import", label: "Apple Health import", icon: Bolt },
      { to: "/settings/travel", label: "Travel", icon: Plane },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: User,
    children: [
      { to: "/account", label: "Profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings2 },
      { to: "/settings/sharing", label: "Sharing", icon: Shield },
    ],
  },
];

/**
 * Hides nav entries for dark-launched surfaces (docs/LAUNCH-AUDIT.md).
 * Fails closed: while flags load, flagged entries stay hidden.
 */
export function filterNavTree(tree: NavGroup[], flags: PlatformFlags | undefined): NavGroup[] {
  const visible = (to: string | undefined): boolean => {
    if (to === "/community") return flags?.community === true;
    if (to === "/my-health-dna") return flags?.dna === true;
    return true;
  };
  return tree
    .filter((g) => visible(g.to))
    .map((g) => (g.children ? { ...g, children: g.children.filter((c) => visible(c.to)) } : g));
}

/** Legacy flat list, kept for the mobile bottom nav. */
export type NavItem = {
  to:
    | "/today"
    | "/journal"
    | "/timeline"
    | "/insights"
    | "/account"
    | "/tools"
    | "/settings"
    | "/hydration";
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { to: "/today", label: "Today", icon: Sun },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/hydration", label: "Intake", icon: Droplets },
  { to: "/timeline", label: "Timeline", icon: Clock },
  { to: "/insights", label: "Patterns", icon: TrendingUp },
  { to: "/tools", label: "Tools", icon: Wrench },
  { to: "/account", label: "Account", icon: User },
  { to: "/settings", label: "Settings", icon: Settings2 },
];
