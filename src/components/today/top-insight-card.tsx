import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { computeUserPatterns, type PatternCard } from "@/lib/insights-patterns.functions";
import { cn } from "@/lib/utils";

/**
 * Surfaces the single most relevant pattern from Insights v2 on the Today screen.
 * Picks the first "watch" card, otherwise the first card available. Hidden
 * silently when there are no patterns yet (avoids competing with empty states).
 */
export function TopInsightCard() {
  const fn = useServerFn(computeUserPatterns);
  const { data } = useQuery({
    queryKey: ["today", "top-insight"],
    queryFn: () => fn(),
    staleTime: 1000 * 60 * 30,
  });
  const cards: PatternCard[] = data?.cards ?? [];
  if (cards.length === 0) return null;
  const card = cards.find((c) => c.tone === "watch") ?? cards[0];
  const Icon = card.tone === "watch" ? AlertTriangle : card.tone === "supportive" ? Sparkles : Info;
  const accent =
    card.tone === "watch"
      ? "ring-amber-500/30 bg-amber-500/5"
      : card.tone === "supportive"
        ? "ring-emerald-500/30 bg-emerald-500/5"
        : "ring-border bg-card";
  const iconClass =
    card.tone === "watch"
      ? "text-amber-500"
      : card.tone === "supportive"
        ? "text-emerald-500"
        : "text-muted-foreground";
  return (
    <Link
      to="/insights"
      className={cn(
        "mt-6 block rounded-2xl ring-1 p-5 transition-colors hover:bg-secondary/40",
        accent,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow text-muted-foreground">A pattern Purple noticed</p>
          <p className="mt-1 font-serif text-foreground">{card.title}</p>
          <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed line-clamp-3">
            {card.detail}
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}
