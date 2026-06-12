import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { listCaregiverOwners } from "@/lib/care.functions";
import { getCareChatUnreadTotal } from "@/lib/care-chat.functions";

/**
 * Sidebar/menu entry that only appears when the current user has at least one
 * *incoming* active care relationship (i.e. someone is sharing with them).
 * Mirrors the visual treatment of <SideLink/> in sidebar-nav.tsx.
 */
export function CaregiverNavLink({
  variant = "sidebar",
  onClick,
}: {
  variant?: "sidebar" | "sheet";
  onClick?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fn = useServerFn(listCaregiverOwners);
  const q = useQuery({
    queryKey: ["care", "owners-switcher"],
    queryFn: () => fn(),
    staleTime: 60_000,
    retry: false,
  });
  const unreadFn = useServerFn(getCareChatUnreadTotal);
  const chatQ = useQuery({
    queryKey: ["care-chat", "unread-total"],
    queryFn: () => unreadFn(),
    refetchInterval: 30_000,
    retry: false,
  });

  const ownersCount = q.data?.owners.length ?? 0;
  const chatUnread = chatQ.data?.total ?? 0;
  if (ownersCount === 0 && chatUnread === 0) return null;

  const active = pathname === "/care" || pathname.startsWith("/care/");
  const unread =
    q.data?.owners.reduce(
      (acc, o) => acc + (typeof o.unread_total === "number" ? o.unread_total : 0),
      0,
    ) ?? 0;
  const totalUnread = unread + chatUnread;

  if (variant === "sheet") {
    return (
      <Link
        to="/care"
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
          active
            ? "bg-secondary text-foreground font-medium"
            : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
        )}
      >
        <HeartHandshake className="h-5 w-5" strokeWidth={active ? 2 : 1.6} />
        <span className="flex-1">Caregiver</span>
        {totalUnread > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground tabular-nums">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      to="/care"
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
        "justify-center lg:justify-start",
        active
          ? "bg-secondary text-foreground font-medium"
          : "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <HeartHandshake
        className={cn("h-5 w-5 shrink-0", active && "text-[color:var(--purple-primary)]")}
        strokeWidth={active ? 2 : 1.6}
      />
      <span className="hidden lg:inline flex-1">Caregiver</span>
      {totalUnread > 0 && (
        <span className="hidden lg:inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground tabular-nums">
          {totalUnread > 99 ? "99+" : totalUnread}
        </span>
      )}
    </Link>
  );
}
