import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, User, HeartHandshake, Settings, LogOut, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listCaregiverOwners } from "@/lib/care.functions";
import { getAvatarSignedUrl } from "@/lib/avatar.functions";
import { useAuth } from "@/integrations/supabase/auth-context";
import { cn } from "@/lib/utils";

function initialsFrom(first?: string | null, last?: string | null, email?: string | null) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (f || l) return ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || (f[0] ?? "?").toUpperCase();
  const e = (email ?? "").trim();
  return (e[0] ?? "?").toUpperCase();
}

export function ProfileMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const queryClient = useQueryClient();

  const fetchOwners = useServerFn(listCaregiverOwners);
  const ownersQ = useQuery({
    queryKey: ["care", "owners-switcher"],
    queryFn: () => fetchOwners(),
    staleTime: 60_000,
    enabled: !!session,
    retry: false,
  });
  const owners = ownersQ.data?.owners ?? [];

  const fetchAvatar = useServerFn(getAvatarSignedUrl);
  const avatarQ = useQuery({
    queryKey: ["avatar", "me"],
    queryFn: () => fetchAvatar(),
    staleTime: 5 * 60_000,
    enabled: !!session,
    retry: false,
  });

  const inCaregiverMode = pathname === "/care" || pathname.startsWith("/care/");
  const initials = initialsFrom(
    avatarQ.data?.first_name,
    avatarQ.data?.last_name,
    session?.user?.email,
  );
  const displayName =
    [avatarQ.data?.first_name, avatarQ.data?.last_name].filter(Boolean).join(" ").trim() ||
    session?.user?.email ||
    "Account";

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/sign-in", replace: true });
  };

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        className={cn(
          "inline-flex items-center gap-1 rounded-full pl-0.5 pr-2 py-0.5 transition hover:bg-secondary/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <Avatar url={avatarQ.data?.url ?? null} initials={initials} size={32} />
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar url={avatarQ.data?.url ?? null} initials={initials} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-[11px] text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
        {owners.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
              Switch role
            </DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => navigate({ to: "/today" })}
              className={!inCaregiverMode ? "bg-primary/5" : undefined}
            >
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>View as myself</span>
                <span className="text-[10px] text-muted-foreground">Your own data</span>
              </div>
            </DropdownMenuItem>
            {owners.map((o) => {
              const name =
                o.profile?.community_display_name?.trim() ||
                [o.profile?.first_name, o.profile?.last_name].filter(Boolean).join(" ").trim() ||
                "Their account";
              const active = inCaregiverMode && pathname === `/care/${o.owner_id}`;
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
                  <span className="flex-1 truncate">Caring for {name}</span>
                  {o.unread_total > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground tabular-nums">
                      {o.unread_total > 99 ? "99+" : o.unread_total}
                    </span>
                  )}
                </DropdownMenuItem>
              );
            })}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account">
            <UserCircle className="mr-2 h-4 w-4 text-muted-foreground" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4 text-muted-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Avatar({ url, initials, size }: { url: string | null; initials: string; size: number }) {
  return (
    <span
      className="inline-flex items-center justify-center overflow-hidden rounded-full font-medium text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
        background: url ? "transparent" : "var(--purple-primary, #7c5cff)",
      }}
      aria-hidden
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}
