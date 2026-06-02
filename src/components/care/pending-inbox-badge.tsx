import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox } from "lucide-react";
import { getPendingChangesCount } from "@/lib/care.functions";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "compact" | "full";
  onNavigate?: () => void;
  className?: string;
};

export function PendingInboxBadge({ variant = "compact", onNavigate, className }: Props) {
  const fetchCount = useServerFn(getPendingChangesCount);
  const { data } = useQuery({
    queryKey: ["care", "pending-count"],
    queryFn: () => fetchCount(),
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: false,
  });
  const count = data?.count ?? 0;
  if (count <= 0) return null;

  if (variant === "full") {
    return (
      <Link
        to="/care/inbox"
        onClick={onNavigate}
        aria-label={`Caregiver inbox — ${count} pending`}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
          "text-[color:var(--text-tertiary)] hover:bg-secondary/60 hover:text-foreground",
          className,
        )}
      >
        <Inbox className="h-5 w-5" strokeWidth={1.6} />
        <span className="flex-1">Inbox</span>
        <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-[color:var(--purple-primary)] text-[color:var(--purple-foreground,white)] text-[11px] font-medium">
          {count > 99 ? "99+" : count}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/care/inbox"
      onClick={onNavigate}
      aria-label={`Caregiver inbox — ${count} pending`}
      className={cn(
        "relative inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Inbox className="h-5 w-5" />
      <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-[18px] h-[18px] px-1 items-center justify-center rounded-full bg-[color:var(--purple-primary)] text-[color:var(--purple-foreground,white)] text-[10px] font-semibold leading-none">
        {count > 9 ? "9+" : count}
      </span>
    </Link>
  );
}