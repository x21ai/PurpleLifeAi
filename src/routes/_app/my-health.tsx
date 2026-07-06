import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Moon, Activity, Heart, Clock, Waves, ChevronRight,
  Sparkles, Info, UserCircle, Dna,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MetricKey } from "@/lib/biometric-metrics";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCareProfile } from "@/lib/care-profile.functions";
import { getConditions } from "@/lib/condition-catalog";
import {
  getScoreSnapshot,
  getHealthNarrative,
  type ScoreSnapshot,
  type HealthNarrative,
} from "@/lib/health-scores.functions";
import { useAuth } from "@/integrations/supabase/auth-context";

function steps(n: number | null | undefined): string {
  return n == null ? "–" : n.toLocaleString();
}

export const Route = createFileRoute("/_app/my-health")({
  head: () => ({
    meta: [
      { title: "My Health · Purple" },
      { name: "description", content: "The long view of your body, your patterns, your year." },
    ],
  }),
  component: MyHealthPage,
});

type Status = "thriving" | "good" | "attention" | "care";
const STATUS_LABEL: Record<Status, string> = {
  thriving: "Thriving",
  good: "Looking good",
  attention: "Pay attention",
  care: "Needs care",
};
const STATUS_COLOR: Record<Status, string> = {
  thriving: "text-[color:var(--data-good)]",
  good: "text-[color:var(--data-info)]",
  attention: "text-[color:var(--data-warn)]",
  care: "text-[color:var(--data-alert)]",
};
const STATUS_GRAD: Record<Status, string> = {
  thriving: "from-[color:var(--data-good)]/30 to-transparent",
  good: "from-[color:var(--data-info)]/30 to-transparent",
  attention: "from-[color:var(--data-warn)]/30 to-transparent",
  care: "from-[color:var(--data-alert)]/30 to-transparent",
};

function MyHealthPage() {
  useRouteTheme("dark");
  const { t } = useTranslation();
  const fetchProfile = useServerFn(getCareProfile);
  const fetchSnapshot = useServerFn(getScoreSnapshot);
  const fetchNarrative = useServerFn(getHealthNarrative);
  const { session } = useAuth();
  const { data } = useQuery({
    queryKey: ["care-profile-summary"],
    queryFn: () => fetchProfile(),
    enabled: !!session,
  });
  const { data: snap } = useQuery<ScoreSnapshot>({
    queryKey: ["score-snapshot"],
    queryFn: () => fetchSnapshot(),
    enabled: !!session,
  });
  const { data: narrative } = useQuery<HealthNarrative>({
    queryKey: ["health-narrative"],
    queryFn: () => fetchNarrative(),
    staleTime: 6 * 60 * 60 * 1000,
    enabled: !!session,
  });
  const userConditions = getConditions(data?.conditions ?? []);

  const real = snap?.hasData ?? false;
  const hasSteps = real && snap?.stepsAvg30 != null;

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-6 sm:pt-10 pb-32">
      {/* Header */}
      <div className="glass-surface flex items-center justify-between rounded-2xl px-2 py-1">
        <button type="button" aria-label="Info" className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary">
          <Info className="h-4 w-4 text-muted-foreground" />
        </button>
        <h1 className="text-[18px] font-semibold text-foreground">{t("myHealth.title")}</h1>
        <button type="button" aria-label="Profile" className="h-9 w-9 grid place-items-center rounded-full hover:bg-secondary">
          <UserCircle className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Hero */}
      <section className="mt-16 sm:mt-24">
        {/* Decorative arc */}
        <svg viewBox="0 0 600 80" className="mt-6 w-full opacity-60" aria-hidden="true">
          <defs>
            <linearGradient id="arc" x1="0" x2="1">
              <stop offset="0" stopColor="var(--data-alert)" stopOpacity="0.4" />
              <stop offset="0.5" stopColor="var(--purple-primary)" stopOpacity="0.5" />
              <stop offset="1" stopColor="var(--data-good)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path d="M 20 70 Q 300 -20 580 70" fill="none" stroke="url(#arc)" strokeWidth="1.5" />
        </svg>

        <h2 className="mt-10 app-hero-title text-[32px] sm:text-[40px] text-foreground max-w-[600px]">
          The long view of<br/>your health.
        </h2>
        <p className="today-lede mt-6 max-w-[600px] text-foreground/55">
          {narrative?.narrative ??
            "Purple is gathering your recent days to summarize your patterns here."}
        </p>
        {!real && (
          <Link
            to="/settings"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Connect a device to see your readings <ChevronRight className="h-4 w-4" />
          </Link>
        )}

        <button
          type="button"
          className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-[16px] bg-[color:var(--purple-primary)] text-white py-4 font-semibold hover:opacity-90 transition"
        >
          <Sparkles className="h-4 w-4" /> Dive in with Advisor
        </button>
      </section>

      {/* Sections */}
      {real ? (
        <section className="mt-16 glass-card rounded-3xl overflow-hidden divide-y divide-border/60">
          <SectionRow icon={Moon} name="Sleep Health" status="good" metric="sleep_score"
            sub={snap?.sleepScore != null ? `Latest sleep score: ${Math.round(snap.sleepScore)}` : "No sleep data yet"} />
          <SectionRow icon={Waves} name="Stress Management" status="good" metric="stress"
            sub={snap?.stress != null ? `Latest stress score: ${Math.round(snap.stress)}` : "No stress data yet"} />
          <SectionRow icon={Heart} name="Heart Health" status="good" metric="resting_hr"
            sub={snap?.restingHr != null ? `Resting heart rate: ${Math.round(snap.restingHr)} bpm` : "No heart data yet"} />
          <SectionRow icon={Activity} name="Activity" status="good" metric="steps"
            sub={snap?.stepsAvg30 != null ? `Step average: ${steps(snap.stepsAvg30)} / day` : "No activity data yet"} />
          <SectionRow icon={Clock} name="Readiness" status="good" metric="readiness"
            sub={snap?.readiness != null ? `Latest readiness: ${Math.round(snap.readiness)}` : "No readiness data yet"} />
        </section>
      ) : (
        <section className="mt-16 glass-card rounded-3xl overflow-hidden divide-y divide-border/60">
          <SectionRow icon={Moon} name="Sleep Health" metric="sleep_score" sub="No data yet" />
          <SectionRow icon={Waves} name="Stress Management" metric="stress" sub="No data yet" />
          <SectionRow icon={Heart} name="Heart Health" metric="resting_hr" sub="No data yet" />
          <SectionRow icon={Activity} name="Activity" metric="steps" sub="No data yet" />
          <SectionRow icon={Clock} name="Readiness" metric="readiness" sub="No data yet" />
        </section>
      )}

      {/* Step Average detail card */}
      <section className="mt-12 glass-card rounded-[24px] p-6 sm:p-8">
        <div className="h-10 w-10 grid place-items-center rounded-full bg-[color:var(--purple-primary)]/15 text-[color:var(--purple-primary)]">
          <Activity className="h-5 w-5" />
        </div>
        <p className="mt-4 label-eyebrow text-muted-foreground">Step Average</p>
        {hasSteps ? (
          <>
            <p className="mt-2 numeric-display font-serif text-[48px] sm:text-[56px] text-foreground leading-none">
              {steps(snap?.stepsAvg30)}<span className="text-lg text-muted-foreground ml-2 font-sans">steps / day</span>
            </p>
            <p className="mt-4 body-serif text-foreground/70 max-w-[600px]">
              It&rsquo;s natural for daily steps to dip every now and then. Focus on the long haul, and embrace movement whenever it fits your schedule.
            </p>
            <div className="mt-8 space-y-5">
              <ProgressLine label="30-day average" value={snap?.stepsAvg30 ?? 0} max={10000} tone="warn" right={steps(snap?.stepsAvg30)} />
              <ProgressLine label="60-day average" value={snap?.stepsAvg60 ?? 0} max={10000} tone="warn" right={steps(snap?.stepsAvg60)} />
              <ProgressLine label="Baseline goal" value={9000} max={10000} tone="muted" dashed right="9,000" />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 numeric-display font-serif text-[48px] sm:text-[56px] text-foreground leading-none">–</p>
            <p className="mt-4 body-serif text-foreground/70 max-w-[600px]">
              Connect a device or keep logging activity to see your step averages here.
            </p>
            <Link
              to="/settings"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Connect a device <ChevronRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </section>

      {/* Your conditions, deep-link into each one */}
      {userConditions.length > 0 && (
        <section className="mt-16">
          <p className="label-eyebrow text-muted-foreground">Your conditions</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {userConditions.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/condition/$slug"
                  params={{ slug: c.slug }}
                  className="flex items-center justify-between gap-3 glass-card glass-press rounded-2xl px-4 py-3 transition hover:border-foreground/20"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.label}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {c.category.replace(/_/g, " ")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* DNA insights (optional, off by default) */}
      <section className="mt-12">
        <Link
          to="/my-health-dna"
          className="group flex items-center gap-4 rounded-3xl border border-border bg-card px-5 py-4 hover:bg-secondary/40 transition"
        >
          <div className="h-11 w-11 grid place-items-center rounded-full bg-[color:var(--purple-primary)]/15 text-[color:var(--purple-primary)]">
            <Dna className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-foreground">DNA insights (optional)</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Upload a raw file. We look at a small, curated set, never your whole genome.
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
        </Link>
      </section>

      <p className="mt-12 text-[11px] text-muted-foreground/60 text-center">
        <Link to="/today" className="hover:text-foreground">Back to today</Link>
      </p>
    </div>
  );
}

function SectionRow({
  icon: Icon,
  name,
  status,
  sub,
  metric,
}: {
  icon: LucideIcon;
  name: string;
  status?: Status;
  sub: string;
  metric?: MetricKey;
}) {
  const content = (
    <>
      <div className={`h-12 w-12 grid place-items-center rounded-full bg-gradient-to-br ${status ? STATUS_GRAD[status] : "from-secondary to-transparent"}`}>
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-semibold text-foreground">{name}</p>
        {status != null && (
          <p className={`mt-0.5 text-[11px] uppercase tracking-[0.12em] font-medium ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </p>
        )}
        <p className="mt-1 text-[13px] text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </>
  );
  const className =
    "w-full flex items-center gap-4 py-5 text-left hover:bg-secondary/30 transition rounded-md px-2 -mx-2";
  if (metric) {
    return (
      <Link to="/biometrics/$metric" params={{ metric }} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className}>
      {content}
    </button>
  );
}

function ProgressLine({
  label, value, max, tone, dashed, right,
}: { label: string; value: number; max: number; tone: "warn" | "muted"; dashed?: boolean; right: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const fill =
    tone === "warn" ? "bg-[color:var(--data-warn)]" : "bg-muted-foreground/40";
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12px] text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground tabular-nums">{right}</span>
      </div>
      <div className={`mt-2 h-1.5 rounded-full bg-secondary overflow-hidden ${dashed ? "ring-1 ring-dashed ring-border" : ""}`}>
        <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
