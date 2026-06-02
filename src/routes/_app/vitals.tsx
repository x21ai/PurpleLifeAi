import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Moon, Activity, Waves, Utensils, Heart, BarChart3,
  ChevronRight, ArrowLeft, Pencil, Droplets,
} from "lucide-react";
import { useRouteTheme } from "@/lib/use-route-theme";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_app/vitals")({
  head: () => ({ meta: [{ title: "Vitals — Purple" }] }),
  component: VitalsPage,
});

type Band = "excellent" | "good" | "fair" | "attention";

const BAND_COLOR: Record<Band, string> = {
  excellent: "text-[color:var(--data-good)]",
  good: "text-[color:var(--data-info)]",
  fair: "text-[color:var(--data-warn)]",
  attention: "text-[color:var(--data-alert)]",
};

function VitalsPage() {
  useRouteTheme("dark");
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-32">
      <Link to="/today" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("vitals.back")}
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <p className="label-eyebrow text-muted-foreground">{t("vitals.eyebrow")}</p>
        <button type="button" aria-label="Edit" className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary">
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        {t("vitals.title1")}<br/>{t("vitals.title2")}
      </h1>

      {/* Date tabs */}
      <div className="mt-10 flex items-center gap-6 border-b border-border/60">
        {["May 22", "Yesterday", "Today"].map((d, i) => (
          <button
            key={d}
            type="button"
            className={
              "pb-3 text-sm transition " +
              (i === 2
                ? "text-foreground font-semibold border-b-2 border-[color:var(--purple-primary)] -mb-px"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {d}
          </button>
        ))}
      </div>

      <Section icon={Sparkles} name="Readiness">
        <MetricCard title="Readiness Score" status="Pay attention" band="fair" value="58" />
        <MetricCard title="Symptom Radar" status="No signs" band="good" value="—" />
      </Section>

      <Section icon={Moon} name="Sleep">
        <MetricCard title="Sleep Score" status="Pay attention" band="fair" value="70" />
        <MetricCard title="Body Clock" status="Aligned" band="good" value="—" />
      </Section>

      <Section icon={Activity} name="Activity">
        <MetricCard title="Activity Score" status="Optimal" band="excellent" value="87" />
        <MetricCard title="Activity Goal" status="20 / 9,000 steps" band="fair" value="—" />
      </Section>

      <Section icon={Waves} name="Stress">
        <MetricCard title="Daytime Stress" status="Restored" band="good" value="—" />
        <MetricCard title="Resilience" status="Adequate" band="good" value="—" />
      </Section>

      <Section icon={Utensils} name="Metabolic Health">
        <MetricCard title="Glucose" status="No data" band="fair" value="—" />
        <MetricCard title="Meals" status="Log a meal" band="fair" value="—" />
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
        <MetricCard title="Cardiovascular Age" status="2.5 yrs older" band="good" value="Aligned" />
        <MetricCard title="Cardio Capacity" status="Low" band="fair" value="27" sub="VO₂max" />
      </Section>

      <Section icon={BarChart3} name="Core Metrics">
        <MetricCard title="Resting Heart Rate" status="Last sleep" band="good" value="58" sub="bpm" />
        <MetricCard title="HRV" status="Last sleep" band="good" value="42" sub="ms" />
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