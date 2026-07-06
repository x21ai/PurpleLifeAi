import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Loader2,
  Wand2,
  ChevronRight,
  Watch,
  FileText,
  Moon,
  Heart,
  BookOpen,
  Users,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDailyInsightCards } from "@/lib/report-trends.functions";
import { rankedRecommendedItems, type RecommendedItem } from "@/lib/recommended-catalog";
import { useAuth } from "@/integrations/supabase/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useRouteTheme } from "@/lib/use-route-theme";
import { AppPage } from "@/components/layout/app-page";
import { cn } from "@/lib/utils";

const planSearchSchema = z.object({
  tab: z.enum(["protocol", "recommended"]).optional().catch("protocol"),
});

export const Route = createFileRoute("/_app/plan")({
  validateSearch: (search) => planSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Plan · Purple" },
      { name: "description", content: "Your daily protocol and personalized recommendations." },
    ],
  }),
  component: PlanPage,
});

const ICONS: Record<string, LucideIcon> = {
  ring: Watch,
  doc: FileText,
  moon: Moon,
  heart: Heart,
  journal: BookOpen,
  people: Users,
  bp: Activity,
};

function PlanPage() {
  useRouteTheme("dark");
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const segment = tab === "recommended" ? "recommended" : "protocol";

  const setSegment = (next: "protocol" | "recommended") => {
    void navigate({ search: { tab: next }, replace: true });
  };

  return (
    <AppPage width="lg" safeBottom="nav" className="px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-32">
      <p className="label-eyebrow text-[color:var(--purple-primary)]">Plan</p>
      <h1 className="mt-3 app-hero-title text-[32px] sm:text-[36px] text-foreground">
        {segment === "protocol" ? "Your protocol" : "Recommended for you"}
      </h1>
      <p className="today-lede mt-2 text-foreground/55">
        Protocol actions and condition-ranked recommendations.
      </p>

      <div
        className="mt-5 inline-flex rounded-full bg-secondary/50 p-1"
        role="tablist"
        aria-label="Plan sections"
      >
        {(["protocol", "recommended"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={segment === key}
            onClick={() => setSegment(key)}
            className={cn(
              "min-h-[40px] rounded-full px-4 py-2 text-sm font-medium transition",
              segment === key
                ? "bg-[color:var(--purple-primary)]/20 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {key === "protocol" ? "Protocol" : "Recommended"}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {segment === "protocol" ? <ProtocolSegment /> : <RecommendedSegment />}
      </div>
    </AppPage>
  );
}

function ProtocolSegment() {
  const fetchCards = useServerFn(getDailyInsightCards);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["daily-insight-cards"],
    queryFn: () => fetchCards({ data: {} }),
    staleTime: 1000 * 60 * 60,
  });
  const regen = useMutation({
    mutationFn: () => fetchCards({ data: { force: true } }),
    onSuccess: (res) => {
      qc.setQueryData(["daily-insight-cards"], res);
    },
  });

  const cards = data?.cards ?? [];
  const headline = data?.headline ?? null;

  if (isLoading) {
    return <div className="h-28 rounded-2xl border border-border/60 bg-secondary/30 animate-pulse" />;
  }

  if (cards.length === 0) {
    return (
      <div className="glass-surface rounded-[20px] p-5 text-sm text-muted-foreground leading-relaxed">
        Log a few more readings or upload a report to unlock your daily protocol cards.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-4">
        {headline ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{headline}</p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => regen.mutate()}
          disabled={regen.isPending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {regen.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3" />
          )}
          Refresh
        </button>
      </div>
      <div className="space-y-3">
        {cards.map((card, i) => {
          const inner = (
            <div className="glass-surface rounded-[20px] p-4 sm:p-5">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--purple-primary)]/18 text-sm font-bold text-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{card.title}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                  {card.metricKey ? (
                    <p className="mt-3 inline-flex items-center gap-1 text-xs text-[color:var(--purple-primary)]">
                      View metric <ChevronRight className="h-3 w-3" />
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
          if (card.metricKey) {
            return (
              <Link
                key={i}
                to="/reports/trends/$metricKey"
                params={{ metricKey: card.metricKey }}
                className="block"
              >
                {inner}
              </Link>
            );
          }
          return <div key={i}>{inner}</div>;
        })}
      </div>
    </div>
  );
}

function RecommendedSegment() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const { data: profile } = useQuery({
    queryKey: ["plan-profile-conditions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("conditions")
        .eq("id", uid!)
        .maybeSingle();
      return data;
    },
    enabled: !!uid,
  });
  const { data: labCount } = useQuery({
    queryKey: ["plan-lab-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("report_metrics")
        .select("id", { count: "exact", head: true });
      return count ?? 0;
    },
    enabled: !!uid,
  });

  const items = useMemo(() => {
    const conditions = (profile?.conditions as string[] | null) ?? [];
    return rankedRecommendedItems(conditions, { hasLabs: (labCount ?? 0) > 0 });
  }, [profile?.conditions, labCount]);

  if (items.length === 0) {
    return (
      <div className="glass-surface rounded-[20px] p-5 text-sm text-muted-foreground leading-relaxed">
        Set your focus conditions in Account to unlock personalized recommendations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <RecommendedCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function RecommendedCard({ item }: { item: RecommendedItem }) {
  const navigate = useNavigate();
  const Icon = ICONS[item.iconName ?? "doc"] ?? FileText;
  return (
    <div className="glass-surface rounded-[20px] border border-[color:var(--purple-primary)]/10 p-4 sm:p-5">
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--purple-primary)]" />
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow text-[10px]">{item.category}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{item.title}</p>
          {item.disclaimer ? (
            <p className="mt-1 text-xs text-muted-foreground">{item.disclaimer}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void navigate({ to: item.route })}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-[color:var(--purple-primary)]/18 px-4 py-2 text-sm font-medium text-foreground hover:bg-[color:var(--purple-primary)]/28"
          >
            {item.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
