import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type CareRole } from "@/lib/care.scopes";
import { ChevronRight } from "lucide-react";

export type OwnerCardData = {
  relationship_id: string;
  owner_id: string;
  role: string;
  expires_at: string | null;
  last_seen_at: string | null;
  unread_total: number;
  health_signal?: "green" | "amber" | "red";
  health_reasons?: {
    missed_doses_24h?: number;
    seizures_24h?: number;
    journal_silence_72h?: boolean;
  };
  profile: {
    first_name: string | null;
    last_name: string | null;
    community_display_name: string | null;
    conditions: string[] | null;
  } | null;
};

function displayName(p: OwnerCardData["profile"]): string {
  if (!p) return "Their account";
  return (
    p.community_display_name?.trim() ||
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
    "Their account"
  );
}

function relativeTime(iso: string | null): string {
  if (!iso) return "Not visited yet";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function OwnerCard({ owner }: { owner: OwnerCardData }) {
  const name = displayName(owner.profile);
  const conditions = (owner.profile?.conditions ?? []).slice(0, 3);
  const initial = name.charAt(0).toUpperCase();
  const signal = owner.health_signal ?? "green";
  const dotClass =
    signal === "red"
      ? "bg-red-500"
      : signal === "amber"
        ? "bg-amber-500"
        : "bg-emerald-500";
  const reasons = owner.health_reasons;
  const tooltip =
    signal === "green"
      ? "Nothing urgent in the last 24 hours"
      : [
          reasons?.seizures_24h ? `${reasons.seizures_24h} seizure event(s) in 24h` : null,
          reasons?.missed_doses_24h ? `${reasons.missed_doses_24h} missed dose(s) in 24h` : null,
          reasons?.journal_silence_72h ? "No journal in 72h" : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <Link
      to="/care/$ownerId"
      params={{ ownerId: owner.owner_id }}
      className="group block rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-serif text-xl text-primary"
          >
            {initial}
          </div>
          <span
            title={tooltip}
            aria-label={`Status: ${signal}. ${tooltip}`}
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card ${dotClass}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-serif text-xl text-foreground truncate">{name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {relativeTime(owner.last_seen_at)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {owner.unread_total > 0 && (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-[11px] font-medium text-primary-foreground tabular-nums">
                  {owner.unread_total > 99 ? "99+" : owner.unread_total}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {ROLE_LABELS[owner.role as CareRole] ?? owner.role}
            </Badge>
            {conditions.map((c) => (
              <Badge key={c} variant="outline" className="text-[10px] capitalize">
                {c.replace(/_/g, " ")}
              </Badge>
            ))}
            {owner.expires_at && (
              <span className="text-[10px] text-muted-foreground">
                · until {new Date(owner.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}