import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getScoreSnapshot, type ScoreSnapshot } from "@/lib/health-scores.functions";

type VitalItem = {
  key: string;
  label: string;
  value: number | null;
  unit?: string;
  /** Matching biometrics metric route slug, when one exists. */
  metric?: string;
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

  // While the snapshot loads, render a same-shape skeleton so the section
  // reserves its height instead of popping in and shifting the page (CLS).
  if (!data) {
    return (
      <section className="mt-12 sm:mt-16" aria-hidden>
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="label-eyebrow text-muted-foreground">Your signals</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[74px] rounded-2xl border border-border bg-card/60 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  const items = buildItems(data);

  if (!data.hasData || items.length === 0) {
    return (
      <section className="mt-12 sm:mt-16">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="label-eyebrow text-muted-foreground">Your signals</p>
        </div>
        <Link
          to="/settings"
          className="block rounded-2xl border border-border bg-card px-4 py-5 hover:bg-secondary/60 transition"
        >
          <p className="text-sm text-foreground">Connect a device to see your signals</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Oura, Whoop, or Apple Health — your readings appear here once synced.
          </p>
          <span className="mt-3 inline-flex items-center text-xs text-muted-foreground">
            Connect <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </section>
    );
  }

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((item) => (
          <VitalTile key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}
