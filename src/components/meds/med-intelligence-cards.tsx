import * as React from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Flame, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import {
  getMedIntelligence,
  type MedIntelligence,
  type TimeBucket,
} from "@/lib/med-intelligence.functions";

const BUCKET_LABEL: Record<TimeBucket, string> = {
  morning: "morning",
  midday: "midday",
  evening: "evening",
  night: "night",
};

function useMedIntel() {
  const fn = useServerFn(getMedIntelligence);
  return useQuery<MedIntelligence>({
    queryKey: ["med-intelligence"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
}

export function RefillForecastCard() {
  const q = useMedIntel();
  const refills = q.data?.refills ?? [];
  const soon = refills.filter((r) => r.daysLeft <= Math.max(14, r.threshold));
  if (soon.length === 0) return null;
  const worst = soon[0];
  const extras = soon.length - 1;

  const tone =
    worst.daysLeft <= 3
      ? "border-destructive/50 bg-destructive/5 text-destructive"
      : worst.daysLeft <= 7
        ? "border-amber-300/60 bg-amber-50/40 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200"
        : "border-border bg-card text-foreground";

  return (
    <section className={`mt-6 rounded-2xl border p-5 ${tone}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="label-eyebrow opacity-80">Refill ahead</p>
          <p className="mt-1 font-serif text-lg">
            {worst.name} runs out in <span className="tabular-nums">{worst.daysLeft}</span> day
            {worst.daysLeft === 1 ? "" : "s"}
            <span className="text-sm font-sans opacity-75">
              {" "}
              · around {format(parseISO(worst.runoutDate), "EEE, MMM d")}
            </span>
          </p>
          <p className="mt-1 text-xs opacity-75">
            {worst.pillsRemaining} left · {worst.dosesPerDay}/day
            {extras > 0 && ` · +${extras} other ${extras === 1 ? "med" : "meds"} due soon`}
          </p>
          <Link
            to="/meds/$medId"
            params={{ medId: worst.medId }}
            className="mt-3 inline-block text-xs underline underline-offset-2 hover:no-underline"
          >
            Update count or schedule refill →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AdherenceExtrasCard() {
  const q = useMedIntel();
  const data = q.data;
  if (!data) return null;
  const showStreak = data.streakDays > 0;
  const showPattern = !!data.missedPattern;
  if (!showStreak && !showPattern) return null;

  return (
    <section className="mt-4 grid gap-3 sm:grid-cols-2">
      {showStreak && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-foreground" />
            <p className="label-eyebrow text-muted-foreground">On-time streak</p>
          </div>
          <p className="mt-2 font-serif text-2xl text-foreground">
            {data.streakDays} day{data.streakDays === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Every scheduled dose taken, day by day.
          </p>
        </div>
      )}
      {showPattern && data.missedPattern && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-foreground" />
            <p className="label-eyebrow text-muted-foreground">Noticed pattern</p>
          </div>
          <p className="mt-2 text-sm text-foreground">
            Your {BUCKET_LABEL[data.missedPattern.bucket]} doses are missed more often (
            {data.missedPattern.pct}% in the last 30 days).
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Consider an extra reminder around that window.
          </p>
        </div>
      )}
    </section>
  );
}
