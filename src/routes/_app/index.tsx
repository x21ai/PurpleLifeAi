import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { BookOpen, Pill, Zap, ChevronRight, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { ScoreTile } from "@/components/ui-oura/v2/score-tile";
import { NarrativeBlock } from "@/components/ui-oura/v2/narrative-block";
import { BodyMeasurementsRow } from "@/components/ui-oura/v2/body-measurements-row";
import { ScoreHero, bandForReadiness } from "@/components/ui-oura/v2/score-hero";
import { TodayDoses } from "@/components/meds/today-doses";
import { TodayInstallBanner } from "@/components/pwa/today-install-banner";
import { OuraSyncStatus } from "@/components/biometrics/sync-status";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Today — Purple" },
      { name: "description", content: "Your calm space to capture what's happening today." },
    ],
  }),
  component: TodayPage,
});

type Bio = {
  recorded_at: string;
  oura_readiness_score: number | null;
  sleep_score: number | null;
  oura_activity_score: number | null;
  body_temp_deviation_c: number | null;
  respiratory_rate_bpm: number | null;
  spo2_pct: number | null;
};

type Forecast = {
  ai_narrative: string | null;
  risk_score: number;
  band: string;
};

type Profile = { first_name: string | null };

function TodayPage() {
  // Today is the hero mode — always dark.
  useRouteTheme("dark");

  const { session } = useAuth();
  const userId = session?.user.id;

  const [now, setNow] = useState<Date | null>(null);
  const [bio, setBio] = useState<Bio | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [focus, setFocus] = useState<"readiness" | "sleep" | "activity">("sleep");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setNow(new Date()), []);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
      const [b, f, p] = await Promise.all([
        supabase
          .from("biometrics")
          .select(
            "recorded_at, oura_readiness_score, sleep_score, oura_activity_score, body_temp_deviation_c, respiratory_rate_bpm, spo2_pct",
          )
          .eq("source", "oura")
          .gte("recorded_at", since)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("risk_forecasts")
          .select("ai_narrative, risk_score, band")
          .eq("user_id", userId)
          .order("for_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("first_name")
          .eq("id", userId)
          .maybeSingle(),
      ]);
      setBio((b.data as Bio | null) ?? null);
      setForecast((f.data as Forecast | null) ?? null);
      setProfile((p.data as Profile | null) ?? null);
    })();
  }, [userId]);

  const hour = now?.getHours() ?? -1;
  const greeting = !now
    ? "Hi"
    : hour < 5
      ? "Still up"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";
  const firstName = profile?.first_name?.trim();

  const readiness = bio?.oura_readiness_score ?? null;
  const sleep = bio?.sleep_score ?? null;
  const activity = bio?.oura_activity_score ?? null;

  const focusScore =
    focus === "readiness" ? readiness : focus === "sleep" ? sleep : activity;
  const focusLabel =
    focus === "readiness" ? "Readiness" : focus === "sleep" ? "Sleep" : "Activity";

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-10 sm:pt-16 pb-16">
      <div className="mb-6">
        <TodayInstallBanner />
      </div>
      {/* Status bar */}
      <p className="label-eyebrow" suppressHydrationWarning>
        {now ? format(now, "EEEE, MMMM d") : "\u00a0"}
      </p>

      {/* Greeting — Source Serif 4, 32px */}
      <h1
        className="font-serif text-[32px] sm:text-[40px] leading-[1.15] tracking-tight mt-6 text-foreground"
        suppressHydrationWarning
      >
        <span suppressHydrationWarning>{greeting}</span>
        {firstName ? `, ${firstName}` : ""}.
      </h1>

      {/* AI narrative paragraph (max 3 lines feel) */}
      {forecast?.ai_narrative ? (
        <p className="body-serif mt-4 max-w-[600px] text-foreground/75">
          {forecast.ai_narrative}
        </p>
      ) : (
        <p className="body-serif mt-4 max-w-[600px] text-foreground/60">
          How&rsquo;s today feeling?
        </p>
      )}

      {/* Hero score row — three numbers, center focused */}
      <section className="mt-12 sm:mt-16 grid grid-cols-3 items-center gap-2">
        <ScoreTile
          value={readiness ?? "—"}
          label="Readiness"
          active={focus === "readiness"}
          onClick={() => {
            if (focus === "readiness") setExpanded(true);
            else setFocus("readiness");
          }}
        />
        <ScoreTile
          value={sleep ?? "—"}
          label="Sleep"
          active={focus === "sleep"}
          onClick={() => {
            if (focus === "sleep") setExpanded(true);
            else setFocus("sleep");
          }}
        />
        <ScoreTile
          value={activity ?? "—"}
          label="Activity"
          active={focus === "activity"}
          onClick={() => {
            if (focus === "activity") setExpanded(true);
            else setFocus("activity");
          }}
        />
      </section>

      {/* Expanded hero modal — opens when active tile is tapped again */}
      {expanded && typeof focusScore === "number" && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpanded(false)}
        >
          <div
            className="mx-auto max-w-2xl px-5 sm:px-8 py-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="label-eyebrow hover:text-foreground"
              aria-label="Close detail"
            >
              ← Close
            </button>
            <div className="mt-6">
              <ScoreHero
                score={focusScore}
                label={focusLabel}
                band={bandForReadiness(focusScore)}
                phrase={
                  focusScore >= 85 ? "A steady day."
                  : focusScore >= 70 ? "Doing alright."
                  : focusScore >= 50 ? "Worth slowing down."
                  : "Time to be careful."
                }
                narrative={forecast?.ai_narrative ?? undefined}
              />
            </div>
            <div className="mt-6">
              <Link
                to="/today/risk"
                className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground"
              >
                See the full reading <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AI narrative block */}
      {forecast?.ai_narrative && (
        <div className="mt-12">
          <NarrativeBlock>{forecast.ai_narrative}</NarrativeBlock>
        </div>
      )}

      {/* Quick actions — 3 equal-width tiles, 80px tall */}
      <section className="mt-10 grid grid-cols-3 gap-3">
        <QuickAction icon={BookOpen} label="Journal" to="/journal" />
        <QuickAction icon={Pill} label="Meds" to="/meds" />
        <QuickAction icon={Zap} label="Seizure" to="/seizures/new" tone="accent" />
      </section>

      {/* Body measurements row — Temp / Resp / SpO2 */}
      {bio && (
        <div className="mt-12">
          <BodyMeasurementsRow
            items={[
              {
                value:
                  bio.body_temp_deviation_c != null
                    ? `${bio.body_temp_deviation_c > 0 ? "+" : ""}${bio.body_temp_deviation_c.toFixed(1)}°`
                    : "—",
                label: "Temp Δ",
              },
              {
                value: bio.respiratory_rate_bpm ? Math.round(bio.respiratory_rate_bpm) : "—",
                label: "Resp /min",
              },
              {
                value: bio.spo2_pct ? `${Math.round(bio.spo2_pct)}%` : "—",
                label: "SpO₂",
              },
            ]}
          />
        </div>
      )}

      <TodayDoses />

      {bio && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <OuraSyncStatus variant="compact" />
          <Link
            to="/biometrics"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Activity className="h-3 w-3" />
            Dig deeper into your signals
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  to,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: "/journal" | "/meds" | "/seizures/new";
  tone?: "accent";
}) {
  return (
    <Link
      to={to}
      className={
        "flex flex-col items-center justify-center gap-2 rounded-[16px] h-20 transition active:scale-[0.98] " +
        (tone === "accent"
          ? "bg-[color:var(--purple-primary)]/15 text-[color:var(--purple-primary)] ring-1 ring-[color:var(--purple-primary)]/40 hover:bg-[color:var(--purple-primary)]/25"
          : "bg-card text-foreground ring-1 ring-border hover:ring-foreground/30")
      }
    >
      <Icon className="h-6 w-6" />
      <span className="text-[14px] font-semibold">{label}</span>
    </Link>
  );
}