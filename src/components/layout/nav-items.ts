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
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  { id: "today",     label: "Today",     icon: Sun,        to: "/today" },
  {
    id: "journal",
    label: "Journal",
    icon: BookOpen,
    children: [
      { to: "/journal",     label: "All entries", icon: BookOpen },
      { to: "/journal/new", label: "New entry",   icon: Sparkles },
    ],
  },
  {
    id: "body",
    label: "My Body",
    icon: HeartPulse,
    children: [
      { to: "/biometrics", label: "Biometrics",  icon: Activity   },
      { to: "/hydration",  label: "Hydration",   icon: Droplets   },
      { to: "/meds",       label: "Medications", icon: Pill       },
      { to: "/timeline",   label: "Timeline",    icon: Clock      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    icon: TrendingUp,
    children: [
      { to: "/insights", label: "Patterns",  icon: TrendingUp },
      { to: "/reports",  label: "Reports",   icon: FileText   },
      { to: "/reports/medical-history", label: "Medical history PDF", icon: FileText },
    ],
  },
  {
    id: "care",
    label: "Care",
    icon: Users,
    children: [
      { to: "/care",      label: "Caregivers", icon: Users         },
      { to: "/chat-care", label: "Messages",   icon: MessageCircle },
    ],
  },
  {
    id: "community",
    label: "Community",
    icon: Globe,
    children: [
      { to: "/community",           label: "Feed",      icon: Globe    },
      { to: "/community/resources", label: "Resources", icon: FileText },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    children: [
      { to: "/tools",                label: "All tools",        icon: Wrench },
      { to: "/apple-health-import",  label: "Apple Health import", icon: Bolt },
      { to: "/settings/travel",      label: "Travel",           icon: Plane  },
    ],
  },
  {
    id: "account",
    label: "Account",
    icon: User,
    children: [
      { to: "/account",          label: "Profile",  icon: User      },
      { to: "/settings",         label: "Settings", icon: Settings2 },
      { to: "/settings/sharing", label: "Sharing",  icon: Shield    },
      { to: "/privacy",          label: "Privacy",  icon: Shield    },
    ],
  },
];

/** Legacy flat list, kept for the mobile bottom nav. */
export type NavItem = {
  to: "/today" | "/journal" | "/timeline" | "/insights" | "/account" | "/tools" | "/settings" | "/hydration";
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { to: "/today",     label: "Today",     icon: Sun       },
  { to: "/journal",   label: "Journal",   icon: BookOpen  },
  { to: "/hydration", label: "Hydration", icon: Droplets  },
  { to: "/timeline",  label: "Timeline",  icon: Clock     },
  { to: "/insights",  label: "Patterns",  icon: TrendingUp },
  { to: "/tools",     label: "Tools",     icon: Wrench    },
  { to: "/account",   label: "Account",   icon: User      },
  { to: "/settings",  label: "Settings",  icon: Settings2 },
];