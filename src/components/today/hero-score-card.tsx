import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { ScoreArc } from "@/components/ui-oura/score-arc";
import dawn from "@/assets/hero-readiness-dawn.jpg";
import mist from "@/assets/hero-readiness-mist.jpg";
import coast from "@/assets/hero-readiness-coast.jpg";

type Forecast = {
  risk_score: number;
  band: string;
  ai_narrative: string | null;
  for_date: string;
};

function bandFor(score: number): { band: "calm" | "watchful" | "alert"; image: string; caption: string } {
  // risk_score: 0 calm → 100 high risk; we flip semantics for the visual.
  if (score <= 33) return { band: "calm", image: dawn, caption: "Doing alright today" };
  if (score <= 66) return { band: "watchful", image: mist, caption: "Take it gentle today" };
  return { band: "alert", image: coast, caption: "Be careful with yourself" };
}

export function HeroScoreCard() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasOura, setHasOura] = useState(false);

  useEffect(() => {
    if (!userId) { setLoaded(true); return; }
    (async () => {
      const [{ data: f }, { data: tok }] = await Promise.all([
        supabase
          .from("risk_forecasts")
          .select("risk_score, band, ai_narrative, for_date")
          .eq("user_id", userId)
          .order("for_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("oura_tokens")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      setForecast((f as Forecast | null) ?? null);
      setHasOura(!!tok);
      setLoaded(true);
    })();
  }, [userId]);

  if (!loaded) {
    return <div className="mt-8 h-64 rounded-3xl bg-card animate-pulse border border-border" />;
  }

  // Empty state — no forecast yet
  if (!forecast) {
    return (
      <section className="mt-8 relative overflow-hidden rounded-3xl border border-border bg-card">
        <div className="relative h-64">
          <img
            src={mist}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90"
            width={1536}
            height={1024}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/70" />
          <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
            <p className="label-eyebrow text-foreground/70">Today's read</p>
            <p className="mt-3 numeric-display font-serif text-3xl text-foreground">
              Still forming
            </p>
            <p className="mt-2 max-w-sm text-sm text-foreground/70">
              {hasOura
                ? "Check back after your ring syncs."
                : "Connect your Oura ring so I can read your patterns."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const { band, image, caption } = bandFor(forecast.risk_score);
  const readiness = Math.max(0, Math.min(100, 100 - forecast.risk_score));
  const tone = band === "alert" ? "alert" : "cream";

  return (
    <section
      className="mt-8 relative overflow-hidden rounded-3xl border border-border bg-card"
      aria-label={`Today's read — ${caption}, ${readiness} out of 100`}
    >
      <div className="relative h-72 sm:h-80">
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          width={1536}
          height={1024}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/0 via-foreground/10 to-foreground/55" />

        <div className="relative h-full flex flex-col items-center justify-end pb-8 px-6">
          <div className="relative flex items-center justify-center">
            <ScoreArc score={readiness} size={240} stroke={5} tone={tone} ariaLabel={`Readiness ${readiness}`} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
              <p className="numeric-display font-serif text-[64px] sm:text-[72px] text-[color:var(--background)] drop-shadow-sm">
                {readiness}
              </p>
              <p
                className="mt-1 label-eyebrow"
                style={{ color: "var(--background)", opacity: 0.85 }}
              >
                Readiness
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 sm:px-8 py-5">
        <p className="font-serif text-xl sm:text-2xl text-foreground">{caption}</p>
        {forecast.ai_narrative && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-prose">
            {forecast.ai_narrative}
          </p>
        )}
      </div>
    </section>
  );
}