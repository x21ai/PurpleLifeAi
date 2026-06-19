import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { format } from "date-fns";
import {
  BookOpen,
  Pill,
  Zap,
  ChevronRight,
  ChevronDown,
  Activity,
  Droplets,
  RefreshCw,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { whoopIncrementalSync } from "@/lib/whoop.functions";
import { WEARABLE_PROVIDERS } from "@/lib/wearable-sync";
import { ScoreTile } from "@/components/ui-oura/v2/score-tile";
import { NarrativeBlock } from "@/components/ui-oura/v2/narrative-block";
import { BodyMeasurementsRow } from "@/components/ui-oura/v2/body-measurements-row";
import { ScoreHero, bandForReadiness } from "@/components/ui-oura/v2/score-hero";
import { TodayDoses } from "@/components/meds/today-doses";
import { MedsMiniTimeline } from "@/components/meds/meds-mini-timeline";
import { TripBanner } from "@/components/travel/trip-banner";
import { TodayInstallBanner } from "@/components/pwa/today-install-banner";
import { ConnectWearablesCard } from "@/components/today/connect-wearables-card";
import { MissedDoseCatchup } from "@/components/today/missed-dose-catchup";
import { RestoreBanner } from "@/components/settings/restore-banner";
import { OuraSyncStatus } from "@/components/biometrics/sync-status";
import {
  promptsForConditions,
  showsSeizureFeatures,
  getTodayGreeting,
} from "@/lib/condition-prompts";
import { useCareProfile } from "@/hooks/use-care-profile";
import { TodayEmptyState } from "@/components/today/empty-state";
import { useTranslation } from "react-i18next";
import { QuickAddWater } from "@/components/hydration/quick-add-water";
import { LogAuraSheet } from "@/components/hydration/log-aura-sheet";
import { PatternHintCard } from "@/components/hydration/pattern-hint-card";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { ConditionTipCard } from "@/components/today/condition-tip-card";
import { ConditionWelcomeNudge } from "@/components/today/condition-welcome-nudge";
import { FeatureSuggestionCard } from "@/components/today/feature-suggestion-card";
import { OnboardingChecklist } from "@/components/today/onboarding-checklist";
import { FirstEntryNudge } from "@/components/today/first-entry-nudge";
import { WeeklyRecapCard } from "@/components/today/weekly-recap-card";
import { SevenDayTrendStrip } from "@/components/today/seven-day-trend-strip";
import { ReEngagementNudge } from "@/components/today/re-engagement-nudge";
import { TopInsightCard } from "@/components/today/top-insight-card";
import { TodayVitals } from "@/components/today/today-vitals";
import { PreTripChecklist } from "@/components/today/pre-trip-checklist";
import { TripWrapupCard } from "@/components/today/trip-wrapup-card";

export const Route = createFileRoute("/_app/today")({
  head: () => ({
    meta: [
      { title: "Today · Purple" },
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

type Profile = { first_name: string | null; conditions: string[] | null };

type AdminMessage = { id: string; subject: string; body: string; created_at: string };

function TodayPage() {
  useRouteTheme("dark");
  const { t } = useTranslation();

  const { session } = useAuth();
  const userId = session?.user.id;
  const flags = useFeatureFlags();
  const showHydration = flags.enabled("hydration");
  const showAura = flags.enabled("aura");
  const careProfile = useCareProfile();
  const carePrompts = careProfile?.journalPrompts ?? null;
  const careGreeting = careProfile?.todayGreeting ?? null;

  const [now, setNow] = useState<Date | null>(null);
  const [bio, setBio] = useState<Bio | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [focus, setFocus] = useState<"readiness" | "sleep" | "activity">("sleep");
  const [expanded, setExpanded] = useState(false);
  const [announcement, setAnnouncement] = useState<AdminMessage | null>(null);
  const [journalCount, setJournalCount] = useState<number | null>(null);
  const [emptyDismissed, setEmptyDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("purple-today-empty-dismissed") === "1";
  });
  // One-time warm greeting after onboarding, echoing the user's first entry.
  // Key written by /welcome; cleared after the first Today render.
  const [firstWords, setFirstWords] = useState<string | null>(null);
  // Secondary cards are tucked behind a disclosure so the top stays calm.
  const [showMore, setShowMore] = useState(false);

  useEffect(() => setNow(new Date()), []);

  useEffect(() => {
    try {
      const words = sessionStorage.getItem("purple-first-words");
      if (words) {
        setFirstWords(words);
        sessionStorage.removeItem("purple-first-words");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
    const [b, f, p, msg, jc] = await Promise.all([
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
      supabase.from("profiles").select("first_name, conditions").eq("id", userId).maybeSingle(),
      supabase
        .from("admin_messages")
        .select("id, subject, body, created_at")
        .or(`is_broadcast.eq.true,recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);
    setBio((b.data as Bio | null) ?? null);
    setForecast((f.data as Forecast | null) ?? null);
    setProfile((p.data as Profile | null) ?? null);
    setAnnouncement((msg.data as AdminMessage | null) ?? null);
    setJournalCount(jc.count ?? 0);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Track which pull-based wearables are connected so pull-to-refresh only
  // triggers syncs that are relevant.
  const whoopSync = useServerFn(whoopIncrementalSync);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const entries = await Promise.all(
        WEARABLE_PROVIDERS.map(async (p) => {
          const { data } = await supabase
            .from(p.tokensTable)
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();
          return [p.id, !!data] as const;
        }),
      );
      setConnected(Object.fromEntries(entries));
    })();
  }, [userId]);

  // Pull-to-refresh: a user-initiated gesture. Syncs every connected wearable
  // immediately (bypasses the 3h on-open throttle), then reloads the page data.
  const [refreshing, setRefreshing] = useState(false);
  const [pull, setPull] = useState(0);
  const [syncTick, setSyncTick] = useState(0);
  const startY = useRef<number | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        WEARABLE_PROVIDERS.filter((p) => connected[p.id]).map((p) => {
          if (p.id === "oura") {
            return supabase.functions
              .invoke("oura-sync", { body: { action: "incremental" } })
              .catch(() => undefined);
          }
          if (p.id === "whoop") {
            return Promise.resolve(whoopSync()).catch(() => undefined);
          }
          return Promise.resolve();
        }),
      );
      await load();
      // Tell the sync badge to re-read last_sync_at after the sync completes.
      setSyncTick((n) => n + 1);
    } finally {
      setRefreshing(false);
    }
  }, [connected, whoopSync, load]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const d = e.touches[0].clientY - startY.current;
    if (d > 0) setPull(Math.min(d, 80));
  };
  const onTouchEnd = () => {
    if (pull > 60 && !refreshing) void onRefresh();
    startY.current = null;
    setPull(0);
  };

  const hour = now?.getHours() ?? -1;
  const greeting = !now
    ? "Hi"
    : hour < 5
      ? "Still up"
      : hour < 12
        ? t("todayPage.morning")
        : hour < 18
          ? t("todayPage.afternoon")
          : t("todayPage.evening");
  const firstName = profile?.first_name?.trim();
  const conditionPrompt = useMemo(() => {
    if (!now) return "How's today feeling?";
    const { journalPrompt } = getTodayGreeting(profile?.conditions ?? [], now.getHours());
    const list = promptsForConditions(profile?.conditions ?? []);
    if (carePrompts && carePrompts.length > 0) {
      const day = Math.floor(now.getTime() / 86_400_000);
      return carePrompts[day % carePrompts.length];
    }
    if (list.length === 0) return journalPrompt;
    // Deterministic per-day so the prompt doesn't flicker on re-render.
    const day = Math.floor(now.getTime() / 86_400_000);
    return list[day % list.length];
  }, [profile?.conditions, now, carePrompts]);
  const greetingSuffix = useMemo(() => {
    if (!now) return "";
    if (careGreeting) return careGreeting;
    return getTodayGreeting(profile?.conditions ?? [], now.getHours()).greetingSuffix;
  }, [profile?.conditions, now, careGreeting]);

  const readiness = bio?.oura_readiness_score ?? null;
  const sleep = bio?.sleep_score ?? null;
  const activity = bio?.oura_activity_score ?? null;

  const focusScore = focus === "readiness" ? readiness : focus === "sleep" ? sleep : activity;
  const focusLabel = focus === "readiness" ? "Readiness" : focus === "sleep" ? "Sleep" : "Activity";

  return (
    <div
      className="mx-auto max-w-2xl px-5 sm:px-8 pt-10 sm:pt-16 pb-16"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {(pull > 0 || refreshing) && (
        <div
          className="flex justify-center text-muted-foreground"
          style={{ height: refreshing ? 32 : pull }}
        >
          <RefreshCw
            className={pull > 60 || refreshing ? "animate-spin h-4 w-4 mt-2" : "h-4 w-4 mt-2"}
          />
        </div>
      )}
      <RestoreBanner />
      <div className="mb-6">
        <TodayInstallBanner />
      </div>

      <MissedDoseCatchup />

      {journalCount === 0 && !emptyDismissed && (
        <TodayEmptyState
          onDismiss={() => {
            sessionStorage.setItem("purple-today-empty-dismissed", "1");
            setEmptyDismissed(true);
          }}
        />
      )}

      <p className="label-eyebrow" suppressHydrationWarning>
        {now ? format(now, "EEEE, MMMM d") : "\u00a0"}
      </p>

      <h1
        className="font-serif text-[32px] sm:text-[40px] leading-[1.15] tracking-tight mt-6 text-foreground"
        suppressHydrationWarning
      >
        <span suppressHydrationWarning>{greeting}</span>
        {firstName ? `, ${firstName}` : ""}.
      </h1>

      {firstWords ? (
        <p className="mt-2 text-sm text-muted-foreground" suppressHydrationWarning>
          {t("todayPage.firstWordsNote", { words: firstWords })}
        </p>
      ) : (
        greetingSuffix &&
        !forecast?.ai_narrative && (
          <p className="mt-2 text-sm text-muted-foreground">{greetingSuffix}</p>
        )
      )}

      {forecast?.ai_narrative ? (
        <p className="body-serif mt-4 max-w-[600px] text-foreground/75">{forecast.ai_narrative}</p>
      ) : (
        <p className="body-serif mt-4 max-w-[600px] text-foreground/60">{conditionPrompt}</p>
      )}

      <section className="mt-12 sm:mt-16 grid grid-cols-3 items-center gap-2">
        <ScoreTile
          value={readiness ?? "–"}
          label="Readiness"
          active={focus === "readiness"}
          onClick={() => {
            if (focus === "readiness") setExpanded(true);
            else setFocus("readiness");
          }}
        />
        <ScoreTile
          value={sleep ?? "–"}
          label="Sleep"
          active={focus === "sleep"}
          onClick={() => {
            if (focus === "sleep") setExpanded(true);
            else setFocus("sleep");
          }}
        />
        <ScoreTile
          value={activity ?? "–"}
          label="Activity"
          active={focus === "activity"}
          onClick={() => {
            if (focus === "activity") setExpanded(true);
            else setFocus("activity");
          }}
        />
      </section>

      <TodayVitals />

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
                  focusScore >= 85
                    ? "A steady day."
                    : focusScore >= 70
                      ? "Doing alright."
                      : focusScore >= 50
                        ? "Worth slowing down."
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

      {forecast?.ai_narrative && (
        <div className="mt-12">
          <NarrativeBlock>{forecast.ai_narrative}</NarrativeBlock>
        </div>
      )}

      <section
        className={`mt-10 grid gap-3 ${
          showsSeizureFeatures(profile?.conditions) ? "grid-cols-3" : "grid-cols-2"
        }`}
      >
        <QuickAction icon={BookOpen} label="Journal" to="/journal" />
        <QuickAction icon={Pill} label="Meds" to="/meds" />
        {showsSeizureFeatures(profile?.conditions) && (
          <QuickAction icon={Zap} label="Seizure" to="/seizures/new" tone="accent" />
        )}
      </section>

      <TodayWidgetBoundary name="doses">
        <MedsMiniTimeline className="mb-3" />
        <TodayDoses />
      </TodayWidgetBoundary>

      <div className="mt-10">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="flex w-full items-center justify-between rounded-2xl bg-card ring-1 ring-border px-5 py-3 hover:bg-secondary/40 transition"
        >
          <span className="label-eyebrow text-muted-foreground">More for today</span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${showMore ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {showMore && (
        <div className="mt-4 space-y-4">
          <ConnectWearablesCard />
          <ConditionWelcomeNudge />
          {journalCount != null && journalCount > 0 && (
            <ReEngagementNudge conditions={profile?.conditions ?? []} hasAnyEntries />
          )}
          {announcement && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="label-eyebrow">{t("todayPage.fromTeam")}</p>
              <p className="mt-2 font-serif text-lg text-foreground">{announcement.subject}</p>
              <p className="mt-1 text-sm text-muted-foreground">{announcement.body}</p>
            </div>
          )}
          {bio && (
            <BodyMeasurementsRow
              items={[
                {
                  value:
                    bio.body_temp_deviation_c != null
                      ? `${bio.body_temp_deviation_c > 0 ? "+" : ""}${bio.body_temp_deviation_c.toFixed(1)}°`
                      : "–",
                  label: "Temp Δ",
                },
                {
                  value: bio.respiratory_rate_bpm ? Math.round(bio.respiratory_rate_bpm) : "–",
                  label: "Resp /min",
                },
                {
                  value: bio.spo2_pct ? `${Math.round(bio.spo2_pct)}%` : "–",
                  label: "SpO₂",
                },
              ]}
            />
          )}
          <TodayWidgetBoundary name="travel">
            <TripBanner />
            <PreTripChecklist />
            <TripWrapupCard />
          </TodayWidgetBoundary>
          <TodayWidgetBoundary name="setup">
            <OnboardingChecklist />
          </TodayWidgetBoundary>
          <TodayWidgetBoundary name="first-entry-nudge">
            <FirstEntryNudge />
          </TodayWidgetBoundary>
          <TodayWidgetBoundary name="tips">
            <ConditionTipCard conditions={profile?.conditions} />
          </TodayWidgetBoundary>
          <TodayWidgetBoundary name="suggestions">
            <FeatureSuggestionCard />
          </TodayWidgetBoundary>
          <TodayWidgetBoundary name="recap">
            <WeeklyRecapCard />
          </TodayWidgetBoundary>
          <TodayWidgetBoundary name="trends">
            <SevenDayTrendStrip />
          </TodayWidgetBoundary>
          <TodayWidgetBoundary name="insight">
            <TopInsightCard />
          </TodayWidgetBoundary>

          {showHydration && (
            <section className="rounded-2xl ring-1 ring-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="label-eyebrow text-muted-foreground">
                    {showAura ? "Hydration & auras" : "Hydration"}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {showAura
                      ? "Log every drink. Capture déjà vu the moment it lands."
                      : "Log every drink, water and electrolytes."}
                  </p>
                </div>
                <Link
                  to="/hydration"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Droplets className="h-3.5 w-3.5" /> Day view <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-4">
                <QuickAddWater />
              </div>
              {showAura && (
                <>
                  <div className="mt-3">
                    <LogAuraSheet />
                  </div>
                  <PatternHintCard />
                </>
              )}
            </section>
          )}

          {bio && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <OuraSyncStatus variant="compact" refreshSignal={syncTick} />
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
      )}
    </div>
  );
}

class TodayWidgetBoundary extends Component<
  { name: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn(`[today] ${this.props.name} widget failed`, error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
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
