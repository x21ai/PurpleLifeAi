import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { Zap, Plus, Sparkles, AlertTriangle, Info, ChevronRight, PenLine, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { cn } from "@/lib/utils";
import { MetricNumber } from "@/components/ui-oura/metric-number";
import { WaveTrend, type WaveSeries } from "@/components/ui-oura/wave-trend";
import { useRouteTheme } from "@/lib/use-route-theme";
import { NarrativeBlock } from "@/components/ui-oura/v2/narrative-block";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { computeUserPatterns, type PatternCard } from "@/lib/insights-patterns.functions";
import {
  getVitalsSnapshot,
  getHealthRecordsCounts,
  getVitalGoals,
  type VitalGoal,
} from "@/lib/health-vitals.functions";
import { REPORT_CATEGORIES } from "@/lib/report-categories";
import { QuickLogVitalSheet, type VitalKind } from "@/components/insights/quick-log-vital-sheet";
import { SetGoalSheet } from "@/components/insights/set-goal-sheet";
import { Target, Wand2, Loader2 } from "lucide-react";
import { getDailyInsightCards } from "@/lib/report-trends.functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFreshAccount } from "@/hooks/use-fresh-account";
import { RouteEmptyState } from "@/components/empty-states/route-empty-state";

type SeizureRow = {
  id: string;
  started_at: string;
  type: string | null;
  duration_seconds: number | null;
  severity: number | null;
  witnessed: boolean;
  injury: boolean;
  notes: string | null;
};

export const Route = createFileRoute("/_app/insights")({
  head: () => ({ meta: [{ title: "Patterns · Purple" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  useRouteTheme("light");
  const { t } = useTranslation();
  const { session } = useAuth();
  const freshQuery = useFreshAccount();
  const isFresh = freshQuery.data?.isFresh === true;
  const [tracksSeizures, setTracksSeizures] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const uid = session?.user.id;
    if (!uid) return;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("conditions")
        .eq("id", uid)
        .maybeSingle();
      const conds = (data?.conditions ?? []) as string[];
      setTracksSeizures(
        conds.includes("epilepsy") || conds.includes("seizures"),
      );
    })();
  }, [session?.user.id]);

  return (
    <div className="mx-auto max-w-4xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-32">
      <p className="label-eyebrow text-muted-foreground">{t("insights.eyebrow")}</p>
      <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        {t("insights.title1")}<br/>{t("insights.title2")}
      </h1>
      <div className="mt-8 max-w-[600px]">
        <NarrativeBlock>
          {t("insights.intro")}
        </NarrativeBlock>
      </div>

      <ForYouRow isFresh={isFresh} />

      {!isFresh && <TrendsHeader />}

      {!isFresh && <VitalsRow />}

      {!isFresh && <HealthRecordsHub />}

      {tracksSeizures !== null && (
        <Tabs
          defaultValue={isFresh ? "patterns" : tracksSeizures ? "seizures" : "trends"}
          className="mt-14"
        >
          <TabsList className="h-11 rounded-full bg-secondary/60 p-1">
            {tracksSeizures && !isFresh && (
              <TabsTrigger value="seizures" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">{t("insights.tabSeizures")}</TabsTrigger>
            )}
            <TabsTrigger value="trends" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">{t("insights.tabTrends")}</TabsTrigger>
            <TabsTrigger value="patterns" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Patterns</TabsTrigger>
          </TabsList>
          {tracksSeizures && !isFresh && (
            <TabsContent value="seizures" className="mt-6">
              <SeizuresTab />
            </TabsContent>
          )}
          <TabsContent value="trends" className="mt-6">
            <TrendsTab isFresh={isFresh} />
          </TabsContent>
          <TabsContent value="patterns" className="mt-6">
            <PatternsTab isFresh={isFresh} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

type BioRow = {
  recorded_at: string;
  sleep_score: number | null;
  sleep_total_min: number | null;
  hrv_rmssd_ms: number | null;
  resting_hr_bpm: number | null;
};

function ForYouRow({ isFresh }: { isFresh: boolean }) {
  const { t } = useTranslation();
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
  const showEmpty = !isLoading && cards.length === 0;

  if (isFresh) {
    return (
      <section className="mt-10">
        <RouteEmptyState
          testId="fresh-empty-insights"
          eyebrow={t("emptyStates.insightsEyebrow")}
          heading={t("emptyStates.insightsHeading")}
          body={t("emptyStates.insightsBody")}
          icon={Sparkles}
          action={
            <Button asChild size="lg" className="rounded-full h-12 px-6 text-base">
              <Link to="/journal/new">
                <PenLine className="h-4 w-4 mr-2" />
                {t("emptyStates.insightsCta")}
              </Link>
            </Button>
          }
        />
        <p className="mt-3 text-[11px] text-muted-foreground/70">
          Observations only - never a diagnosis. Share with your clinician for context.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="label-eyebrow text-muted-foreground">For you</p>
          <h2 className="mt-1 font-serif text-2xl text-foreground">
            {headline ?? "What Purple is noticing"}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => regen.mutate()}
          disabled={regen.isPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-50"
          title="Refresh observations"
        >
          {regen.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3" />
          )}
          {regen.isPending ? "Thinking…" : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div className="mt-4 h-28 rounded-2xl border border-border/60 bg-secondary/30 animate-pulse" />
      ) : showEmpty ? (
        <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/30 p-5 text-sm text-muted-foreground">
          Log a few more readings or upload a report and Purple will start surfacing patterns here.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => {
            const tone = c.tone ?? "info";
            const accent =
              tone === "attention"
                ? "border-[#FFA8BD]/40 bg-[#FFA8BD]/[0.07]"
                : tone === "watch"
                  ? "border-[#F3D58B]/40 bg-[#F3D58B]/[0.07]"
                  : "border-border/60 bg-secondary/40";
            const inner = (
              <div className={cn("h-full rounded-2xl border p-4 transition hover:shadow-sm", accent)}>
                <p className="text-sm font-medium text-foreground">{c.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                {c.metricKey && (
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground/80">
                    Open trend <ChevronRight className="h-3 w-3" />
                  </p>
                )}
              </div>
            );
            if (c.metricKey) {
              return (
                <Link
                  key={i}
                  to="/reports/trends/$metricKey"
                  params={{ metricKey: c.metricKey }}
                  className="block"
                >
                  {inner}
                </Link>
              );
            }
            return <div key={i}>{inner}</div>;
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground/70">
        Observations only - never a diagnosis. Share with your clinician for context.
      </p>
    </section>
  );
}

function useRecentBiometrics(days: number) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [rows, setRows] = React.useState<BioRow[] | null>(null);
  React.useEffect(() => {
    if (!userId) return;
    const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
    void (async () => {
      const { data } = await supabase
        .from("biometrics")
        .select("recorded_at, sleep_score, sleep_total_min, hrv_rmssd_ms, resting_hr_bpm")
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });
      setRows((data as BioRow[]) ?? []);
    })();
  }, [userId, days]);
  return rows;
}

function avg(nums: (number | null | undefined)[]): number | null {
  const xs = nums.filter((n): n is number => typeof n === "number" && !Number.isNaN(n));
  if (xs.length === 0) return null;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function TrendsHeader() {
  const { t } = useTranslation();
  const rows = useRecentBiometrics(14);
  const sleepMin = rows ? avg(rows.map((r) => r.sleep_total_min)) : null;
  const hrv = rows ? avg(rows.map((r) => r.hrv_rmssd_ms)) : null;
  const rhr = rows ? avg(rows.map((r) => r.resting_hr_bpm)) : null;

  const fmtSleep = (m: number | null) => {
    if (m == null) return "–";
    const h = Math.floor(m / 60);
    const mm = Math.round(m % 60);
    return `${h}h ${mm}m`;
  };

  return (
    <section className="mt-14 grid grid-cols-3 gap-x-6 sm:gap-x-10 gap-y-2 border-y border-border py-8 sm:py-10">
      <MetricNumber size="lg" value={fmtSleep(sleepMin)} label={t("insights.avgSleep")} />
      <MetricNumber size="lg" value={hrv ? Math.round(hrv) : "–"} label={t("insights.hrvMs")} />
      <MetricNumber size="lg" value={rhr ? Math.round(rhr) : "–"} label={t("insights.restBpm")} />
      <p className="col-span-3 mt-3 label-eyebrow text-muted-foreground">
        {t("insights.last14")}
      </p>
    </section>
  );
}

function TrendsTab({ isFresh }: { isFresh: boolean }) {
  const { t } = useTranslation();
  const rows = useRecentBiometrics(14);
  if (isFresh) {
    return (
      <RouteEmptyState
        testId="fresh-empty-trends"
        eyebrow={t("insights.tabTrends")}
        heading={t("insights.freshHeading")}
        body={t("insights.connectWearable")}
        icon={TrendingUp}
        action={
          <Button asChild size="lg" className="rounded-full h-12 px-6 text-base">
            <Link to="/tools">{t("today.wearablesNudgeAction")}</Link>
          </Button>
        }
      />
    );
  }
  if (rows === null) {
    return <div className="h-48 rounded-2xl border border-border bg-card animate-pulse" />;
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
        {t("insights.connectWearable")}
      </div>
    );
  }
  const series: WaveSeries[] = [
    {
      label: "Sleep Score",
      values: rows.map((r) => r.sleep_score ?? 0),
      color: "var(--data-1)",
      format: (v) => `${Math.round(v)}`,
    },
    {
      label: "HRV ms",
      values: rows.map((r) => r.hrv_rmssd_ms ?? 0),
      color: "var(--data-2)",
      format: (v) => `${Math.round(v)}`,
    },
    {
      label: "Resting HR",
      values: rows.map((r) => r.resting_hr_bpm ?? 0),
      color: "var(--data-3)",
      format: (v) => `${Math.round(v)} bpm`,
    },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="label-eyebrow">{t("insights.last14Short")}</p>
      <div className="mt-4">
        <WaveTrend series={series} height={200} />
      </div>
    </div>
  );
}

function SeizuresTab() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [events, setEvents] = React.useState<SeizureRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("seizure_events")
        .select("id, started_at, type, duration_seconds, severity, witnessed, injury, notes")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(500);
      if (active) {
        setEvents((data as SeizureRow[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg text-foreground">{t("insights.last90")}</h2>
        <Button asChild size="sm" variant="outline">
          <Link to="/seizures/new">
            <Plus className="h-4 w-4 mr-1" /> {t("insights.logShort")}
          </Link>
        </Button>
      </div>

      <Heatmap events={events} days={90} />

      <h2 className="font-serif text-lg text-foreground mt-10 mb-3">{t("insights.allEvents")}</h2>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-secondary/40 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Zap className="h-7 w-7 mx-auto text-muted-foreground mb-2" />
          <p className="font-serif text-foreground">{t("insights.noEvents")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("insights.noEventsBody")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => <SeizureRowItem key={e.id} event={e} />)}
        </ul>
      )}
    </div>
  );
}

function SeizureRowItem({ event }: { event: SeizureRow }) {
  // unchanged below
  const d = parseISO(event.started_at);
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-foreground">
            {event.type ? event.type.replace(/_/g, " ") : "Seizure"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(d, "EEE, MMM d · h:mm a")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          {event.duration_seconds ? (
            <span className="text-xs rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              {event.duration_seconds}s
            </span>
          ) : null}
          {event.severity ? (
            <span className="text-xs rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
              sev {event.severity}
            </span>
          ) : null}
          {event.injury ? (
            <span className="text-xs rounded-full bg-destructive/15 px-2 py-0.5 text-destructive">
              injury
            </span>
          ) : null}
        </div>
      </div>
      {event.notes && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.notes}</p>
      )}
    </li>
  );
}

function Heatmap({ events, days }: { events: SeizureRow[]; days: number }) {
  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const key = format(startOfDay(parseISO(e.started_at)), "yyyy-MM-dd");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const today = startOfDay(new Date());
  const cells: { date: Date; key: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const key = format(d, "yyyy-MM-dd");
    cells.push({ date: d, key, count: counts.get(key) ?? 0 });
  }

  // Pad so first column starts on Sunday
  const firstDow = cells[0]?.date.getDay() ?? 0;
  const pad = Array.from({ length: firstDow }, () => null);
  const grid: (typeof cells[0] | null)[] = [...pad, ...cells];

  const intensity = (n: number) => {
    if (n === 0) return "bg-secondary/50";
    if (n === 1) return "bg-primary/30";
    if (n === 2) return "bg-primary/55";
    if (n === 3) return "bg-primary/75";
    return "bg-primary";
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div
        className="grid grid-flow-col gap-1"
        style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
      >
        {grid.map((cell, idx) =>
          cell ? (
            <div
              key={cell.key}
              title={`${format(cell.date, "MMM d")}, ${cell.count} ${cell.count === 1 ? "event" : "events"}`}
              className={cn("aspect-square rounded-[3px]", intensity(cell.count))}
            />
          ) : (
            <div key={`pad-${idx}`} className="aspect-square" />
          ),
        )}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[3px] bg-secondary/50" />
        <span className="h-3 w-3 rounded-[3px] bg-primary/30" />
        <span className="h-3 w-3 rounded-[3px] bg-primary/55" />
        <span className="h-3 w-3 rounded-[3px] bg-primary/75" />
        <span className="h-3 w-3 rounded-[3px] bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}
function PatternsTab({ isFresh }: { isFresh: boolean }) {
  const { t } = useTranslation();
  const fn = useServerFn(computeUserPatterns);
  const q = useQuery({
    queryKey: ["insights", "patterns"],
    queryFn: () => fn(),
    enabled: !isFresh,
  });
  if (isFresh) {
    return (
      <RouteEmptyState
        testId="fresh-empty-patterns"
        eyebrow={t("emptyStates.patternsEyebrow")}
        heading={t("emptyStates.patternsHeading")}
        body={t("emptyStates.patternsBody")}
        icon={Sparkles}
        action={
          <Button asChild size="lg" className="rounded-full h-12 px-6 text-base">
            <Link to="/journal/new">
              <PenLine className="h-4 w-4 mr-2" />
              {t("emptyStates.patternsCta")}
            </Link>
          </Button>
        }
      />
    );
  }
  if (q.isLoading) {
    return <div className="h-48 rounded-2xl border border-border bg-card animate-pulse" />;
  }
  if (q.isError) {
    return (
      <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted-foreground">
        Couldn't load patterns. {(q.error as any)?.message ?? ""}
      </div>
    );
  }
  const cards = q.data?.cards ?? [];
  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <Sparkles className="mx-auto h-7 w-7 text-muted-foreground mb-2" />
        <p className="font-serif text-foreground">Not enough data yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep logging seizures, journal entries, and wearing your tracker. Patterns appear once there's enough signal.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {cards.map((c: PatternCard) => <PatternCardItem key={c.key} card={c} />)}
    </ul>
  );
}

function PatternCardItem({ card }: { card: PatternCard }) {
  const Icon = card.tone === "watch" ? AlertTriangle : card.tone === "supportive" ? Sparkles : Info;
  const accent =
    card.tone === "watch"
      ? "border-amber-200/60 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
      : card.tone === "supportive"
        ? "border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
        : "border-border bg-card";
  const iconClass =
    card.tone === "watch"
      ? "text-amber-600 dark:text-amber-400"
      : card.tone === "supportive"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted-foreground";
  return (
    <li className={cn("rounded-2xl border p-5 sm:p-6", accent)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconClass)} />
        <div className="min-w-0">
          <p className="font-serif text-lg text-foreground">{card.title}</p>
          <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{card.detail}</p>
          {card.evidence && (
            <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              {card.evidence}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

function VitalsRow() {
  const fn = useServerFn(getVitalsSnapshot);
  const goalsFn = useServerFn(getVitalGoals);
  const { data } = useQuery({
    queryKey: ["insights", "vitals"],
    queryFn: () => fn(),
    staleTime: 1000 * 60 * 5,
  });
  const { data: goalsData } = useQuery({
    queryKey: ["insights", "vital-goals"],
    queryFn: () => goalsFn(),
    staleTime: 1000 * 60 * 5,
  });
  const v = data ?? null;
  const goalsByKind = React.useMemo(() => {
    const m = new Map<VitalKind, VitalGoal>();
    for (const g of goalsData?.goals ?? []) m.set(g.kind as VitalKind, g);
    return m;
  }, [goalsData]);
  const [logKind, setLogKind] = React.useState<VitalKind | null>(null);
  const [goalKind, setGoalKind] = React.useState<VitalKind | null>(null);
  type Tile = {
    label: string;
    value: string;
    sub?: string;
    kind: VitalKind;
    numeric: number | null;
    numeric2?: number | null;
    metricKey?: string;
  };
  const tiles: Array<Tile> = [
    {
      label: "Weight",
      value: v?.weightKg != null
        ? `${Math.round(v.weightKg * 10) / 10}`
        : "–",
      sub: v?.weightKg != null ? "kg" : "no reading yet",
      kind: "weight",
      numeric: v?.weightKg ?? null,
      metricKey: "weight",
    },
    {
      label: "Blood pressure",
      value: v?.bpSystolic != null && v?.bpDiastolic != null
        ? `${Math.round(v.bpSystolic)}/${Math.round(v.bpDiastolic)}`
        : "–",
      sub: v?.bpSystolic != null ? "mmHg" : "no reading yet",
      kind: "bp",
      numeric: v?.bpSystolic ?? null,
      numeric2: v?.bpDiastolic ?? null,
      metricKey: "blood_pressure_systolic",
    },
    {
      label: "Glucose",
      value: v?.glucoseMgDl != null ? `${Math.round(v.glucoseMgDl)}` : "–",
      sub: v?.glucoseMgDl != null ? "mg/dL" : "no reading yet",
      kind: "glucose",
      numeric: v?.glucoseMgDl ?? null,
      metricKey: "glucose",
    },
    {
      label: "Blood oxygen",
      value: v?.spo2Pct != null ? `${v.spo2Pct.toFixed(1)}%` : "–",
      sub: v?.spo2Pct != null ? "SpO₂" : "no reading yet",
      kind: "spo2",
      numeric: v?.spo2Pct ?? null,
    },
    {
      label: "Body temperature",
      value: v?.bodyTempC != null ? `${v.bodyTempC.toFixed(1)}°C` : "–",
      sub: v?.bodyTempC != null ? "skin temp" : "no reading yet",
      kind: "temp",
      numeric: v?.bodyTempC ?? null,
    },
    {
      label: "Respiratory rate",
      value: v?.respRate != null ? `${v.respRate.toFixed(0)}` : "–",
      sub: v?.respRate != null ? "breaths / min" : "no reading yet",
      kind: "resp_rate",
      numeric: v?.respRate ?? null,
    },
  ];
  function goalBadge(t: Tile): { tone: "good" | "watch"; label: string } | null {
    const g = goalsByKind.get(t.kind);
    if (!g || t.numeric == null) return null;
    const inPrimary = (g.target_min == null || t.numeric >= g.target_min) && (g.target_max == null || t.numeric <= g.target_max);
    let ok = inPrimary;
    if (t.kind === "bp" && t.numeric2 != null && (g.target_min2 != null || g.target_max2 != null)) {
      const inSecondary = (g.target_min2 == null || t.numeric2 >= g.target_min2) && (g.target_max2 == null || t.numeric2 <= g.target_max2);
      ok = ok && inSecondary;
    }
    return ok ? { tone: "good", label: "In target" } : { tone: "watch", label: "Outside target" };
  }
  return (
    <section className="mt-10">
      <p className="label-eyebrow text-muted-foreground">Vitals</p>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="group relative rounded-2xl border border-border bg-card px-4 py-4"
          >
            <div className="absolute right-2 top-2 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
              <button
                type="button"
                onClick={() => setGoalKind(t.kind)}
                title={`Set target for ${t.label.toLowerCase()}`}
                aria-label={`Set target for ${t.label}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Target className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLogKind(t.kind)}
                title={`Log ${t.label.toLowerCase()}`}
                aria-label={`Log ${t.label}`}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {t.metricKey ? (
              <Link
                to="/reports/trends/$metricKey"
                params={{ metricKey: t.metricKey }}
                className="block pr-14"
              >
                <TileInner t={t} badge={goalBadge(t)} />
              </Link>
            ) : (
              <div className="pr-14">
                <TileInner t={t} badge={goalBadge(t)} />
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Pulled from your uploaded reports and connected wearables. Tap a tile to see the trend,
        the target icon to set a personal range, or + to quick-log.
      </p>
      {logKind && (
        <QuickLogVitalSheet
          kind={logKind}
          open={logKind !== null}
          onOpenChange={(o) => { if (!o) setLogKind(null); }}
        />
      )}
      {goalKind && (
        <SetGoalSheet
          kind={goalKind}
          current={goalsByKind.get(goalKind) ?? null}
          open={goalKind !== null}
          onOpenChange={(o) => { if (!o) setGoalKind(null); }}
        />
      )}
    </section>
  );
}

function TileInner({
  t,
  badge,
}: {
  t: { label: string; value: string; sub?: string };
  badge: { tone: "good" | "watch"; label: string } | null;
}) {
  return (
    <>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.label}</p>
      <p className="mt-2 font-serif text-2xl text-foreground tabular-nums">{t.value}</p>
      {t.sub && <p className="mt-1 text-[11px] text-muted-foreground">{t.sub}</p>}
      {badge && (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
            badge.tone === "good"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
          )}
        >
          {badge.label}
        </p>
      )}
    </>
  );
}

function HealthRecordsHub() {
  const fn = useServerFn(getHealthRecordsCounts);
  const { data } = useQuery({
    queryKey: ["insights", "records-counts"],
    queryFn: () => fn(),
    staleTime: 1000 * 60 * 5,
  });
  const counts = data?.counts ?? {};
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between">
        <p className="label-eyebrow text-muted-foreground">Health records</p>
        <Link
          to="/reports/documents"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          All reports <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {REPORT_CATEGORIES.map((c) => {
          const Icon = c.icon;
          const n = counts[c.slug] ?? 0;
          const href =
            c.slug === "dna"
              ? "/my-health-dna"
              : (`/reports/documents?category=${c.slug}` as const);
          return (
            <Link
              key={c.slug}
              to={href as "/reports/documents"}
              className="group rounded-2xl border border-border bg-card p-4 hover:bg-secondary/40 transition"
            >
              <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full", c.tone)}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">{c.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {n === 0 ? "Nothing yet" : `${n} ${n === 1 ? "record" : "records"}`}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
