import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { Zap, Plus, Sparkles, AlertTriangle, Info } from "lucide-react";
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
  head: () => ({ meta: [{ title: "Patterns — Purple" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  useRouteTheme("light");
  const { t } = useTranslation();
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

      <TrendsHeader />

      <Tabs defaultValue="seizures" className="mt-14">
        <TabsList className="h-11 rounded-full bg-secondary/60 p-1">
          <TabsTrigger value="seizures" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">{t("insights.tabSeizures")}</TabsTrigger>
          <TabsTrigger value="trends" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">{t("insights.tabTrends")}</TabsTrigger>
          <TabsTrigger value="patterns" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Patterns</TabsTrigger>
        </TabsList>
        <TabsContent value="seizures" className="mt-6">
          <SeizuresTab />
        </TabsContent>
        <TabsContent value="trends" className="mt-6">
          <TrendsTab />
        </TabsContent>
        <TabsContent value="patterns" className="mt-6">
          <PatternsTab />
        </TabsContent>
      </Tabs>
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
    if (m == null) return "—";
    const h = Math.floor(m / 60);
    const mm = Math.round(m % 60);
    return `${h}h ${mm}m`;
  };

  return (
    <section className="mt-14 grid grid-cols-3 gap-x-6 sm:gap-x-10 gap-y-2 border-y border-border py-8 sm:py-10">
      <MetricNumber size="lg" value={fmtSleep(sleepMin)} label={t("insights.avgSleep")} />
      <MetricNumber size="lg" value={hrv ? Math.round(hrv) : "—"} label={t("insights.hrvMs")} />
      <MetricNumber size="lg" value={rhr ? Math.round(rhr) : "—"} label={t("insights.restBpm")} />
      <p className="col-span-3 mt-3 label-eyebrow text-muted-foreground">
        {t("insights.last14")}
      </p>
    </section>
  );
}

function TrendsTab() {
  const { t } = useTranslation();
  const rows = useRecentBiometrics(14);
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
              title={`${format(cell.date, "MMM d")} — ${cell.count} ${cell.count === 1 ? "event" : "events"}`}
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