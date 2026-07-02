import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Moon, Activity, Waves, Utensils, Heart, BarChart3,
  ChevronRight, ArrowLeft, Pencil, Droplets,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouteTheme } from "@/lib/use-route-theme";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getScoreSnapshot, type ScoreSnapshot } from "@/lib/health-scores.functions";

export const Route = createFileRoute("/_app/vitals")({
  head: () => ({ meta: [{ title: "Vitals · Purple" }] }),
  component: VitalsPage,
});

type Band = "excellent" | "good" | "fair" | "attention";

const BAND_COLOR: Record<Band, string> = {
  excellent: "text-[color:var(--data-good)]",
  good: "text-[color:var(--data-info)]",
  fair: "text-[color:var(--data-warn)]",
  attention: "text-[color:var(--data-alert)]",
};

const EMPTY = "–";

function fmt(value: number | null | undefined): string {
  return value == null ? EMPTY : String(Math.round(value));
}

function VitalsPage() {
  useRouteTheme("dark");
  const { t } = useTranslation();
  const fetchSnapshot = useServerFn(getScoreSnapshot);
  const { data: snap } = useQuery<ScoreSnapshot>({
    queryKey: ["score-snapshot"],
    queryFn: () => fetchSnapshot(),
  });

  const real = snap?.hasData ?? false;
  const latestLabel = snap?.latestAt
    ? new Date(snap.latestAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "Today";

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-32">
      <Link to="/today" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("vitals.back")}
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="label-eyebrow text-muted-foreground">{t("vitals.eyebrow")}</p>
        </div>
        <button type="button" aria-label="Edit" className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary">
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        {t("vitals.title1")}<br/>{t("vitals.title2")}
      </h1>
      {!real && (
        <Link
          to="/settings"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Connect a device to see your readings <ChevronRight className="h-4 w-4" />
        </Link>
      )}

      {/* Latest reading marker */}
      <div className="mt-10 flex items-center gap-6 border-b border-border/60">
        <span className="pb-3 text-sm text-foreground font-semibold border-b-2 border-[color:var(--purple-primary)] -mb-px">
          {real ? latestLabel : "No data yet"}
        </span>
      </div>

      <Section icon={Sparkles} name="Readiness">
        <MetricCard title="Readiness Score" status={real ? "Latest" : "No data"} band="fair" value={real ? fmt(snap?.readiness) : EMPTY} />
        <MetricCard title="Symptom Radar" status="No data" band="fair" value={EMPTY} />
      </Section>

      <Section icon={Moon} name="Sleep">
        <MetricCard title="Sleep Score" status={real ? "Latest" : "No data"} band="fair" value={real ? fmt(snap?.sleepScore) : EMPTY} />
        <MetricCard title="Body Clock" status="No data" band="fair" value={EMPTY} />
      </Section>

      <Section icon={Activity} name="Activity">
        <MetricCard title="Activity Score" status={real ? "Latest" : "No data"} band="excellent" value={real ? fmt(snap?.activity) : EMPTY} />
        <MetricCard title="Steps" status={real ? "Latest" : "No data"} band="fair" value={real ? fmt(snap?.steps) : EMPTY} />
      </Section>

      <Section icon={Waves} name="Stress">
        <MetricCard title="Daytime Stress" status={real ? "Latest" : "No data"} band="good" value={real ? fmt(snap?.stress) : EMPTY} />
        <MetricCard title="SpO₂" status={real ? "Latest" : "No data"} band="good" value={real ? fmt(snap?.spo2) : EMPTY} sub={real && snap?.spo2 != null ? "%" : undefined} />
      </Section>

      <Section icon={Utensils} name="Metabolic Health">
        <MetricCard title="Glucose" status="No data" band="fair" value={EMPTY} />
        <MetricCard title="Meals" status="Log a meal" band="fair" value={EMPTY} />
      </Section>

      <section className="mt-12">
        <div className="flex items-center gap-3">
          <Droplets className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[18px] font-semibold text-foreground">Hydration & auras</h2>
        </div>
        <Link
          to="/hydration"
          className="mt-4 block rounded-[24px] bg-card p-5 sm:p-6 hover:bg-secondary/60 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-muted-foreground">Open hydration day view</p>
              <p className={`mt-2 text-[12px] uppercase tracking-[0.12em] font-medium ${BAND_COLOR.good}`}>
                Track water, electrolytes, déjà vu
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="mt-5 font-serif text-[28px] sm:text-[36px] text-foreground leading-tight">
            Hourly + minute-precision timeline
          </p>
        </Link>
      </section>

      <Section icon={Heart} name="Heart Health">
        <MetricCard title="Cardio Capacity" status={real ? "Latest" : "No data"} band="fair" value={real ? fmt(snap?.vo2max) : EMPTY} sub="VO₂max" />
        <MetricCard title="Resting Heart Rate" status={real ? "Latest" : "No data"} band="good" value={real ? fmt(snap?.restingHr) : EMPTY} sub="bpm" />
      </Section>

      <Section icon={BarChart3} name="Core Metrics">
        <MetricCard title="HRV" status={real ? "Latest" : "No data"} band="good" value={real ? fmt(snap?.hrvMs) : EMPTY} sub="ms" />
        <MetricCard title="30-day steps" status={real ? "Average" : "No data"} band="good" value={real ? fmt(snap?.stepsAvg30) : EMPTY} />
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  name,
  children,
}: {
  icon: LucideIcon;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-[18px] font-semibold text-foreground">{name}</h2>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        {children}
      </div>
    </section>
  );
}

function MetricCard({
  title, status, band, value, sub,
}: { title: string; status: string; band: Band; value: string; sub?: string }) {
  return (
    <button
      type="button"
      className="relative text-left rounded-[24px] bg-card p-5 sm:p-6 aspect-[1/1.1] flex flex-col justify-between hover:bg-secondary/60 transition"
    >
      <div>
        <p className="text-[13px] text-muted-foreground">{title}</p>
        <p className={`mt-2 text-[12px] uppercase tracking-[0.12em] font-medium ${BAND_COLOR[band]}`}>
          {status}
        </p>
      </div>
      <ChevronRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/60" />
      <p className="numeric-display font-serif text-[44px] sm:text-[56px] text-foreground leading-none">
        {value}
        {sub && <span className="text-base text-muted-foreground ml-2 font-sans">{sub}</span>}
      </p>
    </button>
  );
}