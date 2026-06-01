import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Users } from "lucide-react";
import { listCaregiverOwners } from "@/lib/care.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function name(p: {
  first_name: string | null;
  last_name: string | null;
  community_display_name: string | null;
} | null): string {
  if (!p) return "Their account";
  return (
    p.community_display_name?.trim() ||
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
    "Their account"
  );
}

export function OwnerSwitcher({
  currentOwnerId,
  currentLabel,
}: {
  currentOwnerId: string;
  currentLabel: string;
}) {
  const fn = useServerFn(listCaregiverOwners);
  const navigate = useNavigate();
  const q = useQuery({
    queryKey: ["care", "owners-switcher"],
    queryFn: () => fn(),
    staleTime: 30_000,
  });

  const owners = q.data?.owners ?? [];
  // Hide switcher if only one owner (no use)
  if (owners.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary/40"
        aria-label="Switch person you care for"
      >
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="max-w-[140px] truncate">{currentLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Switch person
        </DropdownMenuLabel>
        {owners.map((o) => {
          const isActive = o.owner_id === currentOwnerId;
          return (
            <DropdownMenuItem
              key={o.owner_id}
              onSelect={() =>
                navigate({ to: "/care/$ownerId", params: { ownerId: o.owner_id } })
              }
              className={isActive ? "bg-primary/5" : undefined}
            >
              <span className="flex-1 truncate">{name(o.profile)}</span>
              {o.unread_total > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground tabular-nums">
                  {o.unread_total > 99 ? "99+" : o.unread_total}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/care" className="text-xs text-muted-foreground">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}