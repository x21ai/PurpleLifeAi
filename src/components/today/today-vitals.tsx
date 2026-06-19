import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getScoreSnapshot, type ScoreSnapshot } from "@/lib/health-scores.functions";
import { DemoNotice } from "@/components/common/demo-badge";

type VitalItem = {
  key: string;
  label: string;
  value: number | null;
  unit?: string;
  /** Matching biometrics metric route slug, when one exists. */
  metric?: string;
};

const DEMO: ScoreSnapshot = {
  readiness: 82,
  sleepScore: 79,
  activity: 74,
  stress: 1,
  hrvMs: 58,
  restingHr: 56,
  vo2max: 44,
  spo2: 97,
  steps: 8200,
  stepsAvg30: null,
  stepsAvg60: null,
  latestAt: null,
  hasData: false,
};

function buildItems(s: ScoreSnapshot): VitalItem[] {
  const all: VitalItem[] = [
    { key: "readiness", label: "Readiness", value: s.readiness, metric: "readiness" },
    { key: "sleep", label: "Sleep", value: s.sleepScore, metric: "sleep_score" },
    { key: "activity", label: "Activity", value: s.activity, metric: "activity_score" },
    { key: "hrv", label: "HRV", value: s.hrvMs, unit: "ms", metric: "hrv" },
    { key: "rhr", label: "Resting HR", value: s.restingHr, unit: "bpm", metric: "resting_hr" },
    { key: "spo2", label: "SpO2", value: s.spo2, unit: "%", metric: "spo2" },
    { key: "stress", label: "Stress", value: s.stress, metric: "stress" },
    { key: "steps", label: "Steps", value: s.steps, metric: "steps" },
    { key: "vo2max", label: "VO2 max", value: s.vo2max },
  ];
  return all.filter((i) => i.value != null);
}

function VitalTile({ item }: { item: VitalItem }) {
  const body = (
    <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground truncate">
        {item.label}
      </p>
      <p className="mt-1 font-serif text-2xl tabular-nums text-foreground">
        {item.value}
        {item.unit ? <span className="ml-1 text-sm text-muted-foreground">{item.unit}</span> : null}
      </p>
    </div>
  );
  if (item.metric) {
    return (
      <Link
        to="/biometrics/$metric"
        params={{ metric: item.metric }}
        className="block hover:opacity-90 transition-opacity"
      >
        {body}
      </Link>
    );
  }
  return body;
}

/**
 * Unified vitals across every connected device (Oura, Whoop, Apple Health),
 * pulled from the cross-source score snapshot. Shows only metrics that have
 * real data; falls back to a clearly labeled demo when there is none.
 */
export function TodayVitals() {
  const fetchSnapshot = useServerFn(getScoreSnapshot);
  const { data } = useQuery<ScoreSnapshot>({
    queryKey: ["score-snapshot"],
    queryFn: () => fetchSnapshot(),
    staleTime: 60_000,
  });

  if (!data) return null;
  const isDemo = !data.hasData;
  const snap = isDemo ? DEMO : data;
  const items = buildItems(snap);
  if (items.length === 0) return null;

  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="label-eyebrow text-muted-foreground">Your signals</p>
        <Link
          to="/biometrics"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {isDemo && <DemoNotice className="mb-3" />}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item) => (
          <VitalTile key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}
