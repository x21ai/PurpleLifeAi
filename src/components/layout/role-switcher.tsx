import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, User, HeartHandshake } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listCaregiverOwners } from "@/lib/care.functions";
import { cn } from "@/lib/utils";

/**
 * Role switcher pill — only renders when the user is BOTH a patient (always
 * true, they have their own account) AND a caregiver (has at least one
 * incoming care relationship). Lets them flip context cleanly between
 * "My account" (their own data) and "Caregiver" (someone else's dashboard).
 */
export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const fn = useServerFn(listCaregiverOwners);
  const q = useQuery({
    queryKey: ["care", "owners-switcher"],
    queryFn: () => fn(),
    staleTime: 60_000,
    retry: false,
  });

  const owners = q.data?.owners ?? [];
  if (owners.length === 0) return null;

  const inCaregiverMode = pathname === "/care" || pathname.startsWith("/care/");
  const label = inCaregiverMode ? "Caregiver" : "My account";
  const Icon = inCaregiverMode ? HeartHandshake : User;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switch role"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40",
          compact && "px-2 py-1",
        )}
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {!compact && <span className="max-w-[120px] truncate">{label}</span>}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
          Switch role
        </DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => navigate({ to: "/today" })}
          className={!inCaregiverMode ? "bg-primary/5" : undefined}
        >
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span>My account</span>
            <span className="text-[10px] text-muted-foreground">Your own data</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
          Caring for
        </DropdownMenuLabel>
        {owners.map((o) => {
          const name =
            o.profile?.community_display_name?.trim() ||
            [o.profile?.first_name, o.profile?.last_name]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            "Their account";
          const active =
            inCaregiverMode && pathname === `/care/${o.owner_id}`;
          return (
            <DropdownMenuItem
              key={o.owner_id}
              onSelect={() =>
                navigate({
                  to: "/care/$ownerId",
                  params: { ownerId: o.owner_id },
                })
              }
              className={active ? "bg-primary/5" : undefined}
            >
              <HeartHandshake className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="flex-1 truncate">{name}</span>
              {o.unread_total > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground tabular-nums">
                  {o.unread_total > 99 ? "99+" : o.unread_total}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}