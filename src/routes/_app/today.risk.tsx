import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { ScoreArc } from "@/components/ui-oura/score-arc";
import { useRouteTheme } from "@/lib/use-route-theme";

type Factor = {
  key: string;
  label: string;
  detail: string;
  weight: number;
};

type Forecast = {
  risk_score: number;
  band: string;
  ai_narrative: string | null;
  top_factors: Factor[] | null;
  model_version: string | null;
  computed_at: string;
  for_date: string;
};

export const Route = createFileRoute("/_app/today/risk")({
  head: () => ({
    meta: [
      { title: "Today's reading — Purple" },
      { name: "description", content: "Why today reads the way it does." },
    ],
  }),
  component: RiskDetailPage,
});

function bandTone(band: string): { ring: "cream" | "alert"; chip: string; label: string } {
  switch (band) {
    case "high":
      return { ring: "alert", chip: "bg-[color:var(--data-alert)]/15 text-[color:var(--data-alert)]", label: "High" };
    case "elevated":
      return { ring: "alert", chip: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]", label: "Elevated" };
    case "moderate":
      return { ring: "cream", chip: "bg-secondary text-secondary-foreground", label: "Moderate" };
    default:
      return { ring: "cream", chip: "bg-secondary text-secondary-foreground", label: "Low" };
  }
}

function RiskDetailPage() {
  useRouteTheme("dark");
  const { session } = useAuth();
  const userId = session?.user.id;
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoaded(true);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("risk_forecasts")
        .select("risk_score, band, ai_narrative, top_factors, model_version, computed_at, for_date")
        .eq("user_id", userId)
        .order("for_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      setForecast((data as unknown as Forecast | null) ?? null);
      setLoaded(true);
    })();
  }, [userId]);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-24">
      <Link to="/today" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" />
        Back to today
      </Link>

      <p className="label-eyebrow mt-10 text-muted-foreground">Today&rsquo;s reading</p>
      <h1 className="font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] mt-3 text-foreground">
        Why today reads the way it does.
      </h1>

      {!loaded ? (
        <div className="mt-10 h-64 rounded-3xl bg-card animate-pulse border border-border" />
      ) : !forecast ? (
        <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center">
          <p className="font-serif text-xl">No reading yet for today.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Purple computes a fresh reading once a day at dawn.
          </p>
        </div>
      ) : (
        <ForecastDetail forecast={forecast} />
      )}
    </div>
  );
}

function ForecastDetail({ forecast }: { forecast: Forecast }) {
  const tone = bandTone(forecast.band);
  const readiness = Math.max(0, Math.min(100, 100 - forecast.risk_score));
  const factors = forecast.top_factors ?? [];

  return (
    <>
      <section className="mt-10 rounded-3xl border border-border bg-card px-6 sm:px-8 py-8 flex flex-col items-center text-center">
        <div className="relative">
          <ScoreArc score={readiness} size={260} stroke={6} tone={tone.ring} ariaLabel={`Readiness ${readiness}`} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-3">
            <p className="numeric-display font-serif text-[88px] text-foreground">{readiness}</p>
            <p className="label-eyebrow mt-1">Readiness</p>
          </div>
        </div>
        <span className={`mt-6 inline-flex rounded-full px-3 py-1 text-[11px] tracking-[0.18em] uppercase font-medium ${tone.chip}`}>
          {tone.label} · score {forecast.risk_score}
        </span>
        {forecast.ai_narrative && (
          <p className="mt-6 font-serif text-xl sm:text-2xl text-foreground max-w-prose leading-snug">
            {forecast.ai_narrative}
          </p>
        )}
      </section>

      <p className="label-eyebrow mt-12">What&rsquo;s shifting</p>
      {factors.length === 0 ? (
        <p className="mt-4 font-serif text-lg text-muted-foreground">
          Nothing in your data is out of pattern. Steady is good.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {factors.map((f) => (
            <li
              key={f.key}
              className="rounded-2xl border border-border bg-card px-5 py-4 flex items-start gap-4"
            >
              <div className="flex-1">
                <p className="font-serif text-lg text-foreground">{f.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.detail}</p>
              </div>
              <span className="label-eyebrow shrink-0 mt-1">+{f.weight}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-12 text-[11px] text-muted-foreground/70 text-center">
        Model {forecast.model_version ?? "unknown"} ·{" "}
        computed {format(new Date(forecast.computed_at), "MMM d, h:mm a")}
      </p>
    </>
  );
}
