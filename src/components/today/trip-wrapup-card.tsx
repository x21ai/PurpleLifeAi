import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Plane, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";

type EndedTrip = {
  id: string;
  label: string | null;
  destination_tz: string;
  depart_at: string;
  return_at: string;
  status: string;
};

const DISMISS_PREFIX = "purple-trip-wrapped-";

/**
 * Shown on Today when a trip's return_at is in the last 3 days and the user
 * hasn't dismissed the wrap-up. Also auto-marks the trip as `ended` so the
 * trip banner stops showing. Links to the journal for a quick recap.
 */
export function TripWrapupCard() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [trip, setTrip] = React.useState<EndedTrip | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    void (async () => {
      const nowIso = new Date().toISOString();
      const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
      const { data } = await supabase
        .from("trips")
        .select("id, label, destination_tz, depart_at, return_at, status")
        .lt("return_at", nowIso)
        .gte("return_at", threeDaysAgo)
        .neq("status", "cancelled")
        .order("return_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const t = data as EndedTrip | null;
      if (!t) {
        setTrip(null);
        return;
      }
      // Auto-flip status to ended so other UI (TripBanner, etc.) stops treating it as live.
      if (t.status !== "ended") {
        await supabase.from("trips").update({ status: "ended" }).eq("id", t.id);
      }
      try {
        setDismissed(localStorage.getItem(DISMISS_PREFIX + t.id) === "1");
      } catch {
        /* ignore */
      }
      setTrip(t);
    })();
  }, [userId]);

  if (!trip || dismissed) return null;

  const destShort = (trip.label?.trim() || trip.destination_tz.split("/").pop() || trip.destination_tz).replace(/_/g, " ");
  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_PREFIX + trip.id, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <aside
      aria-label="Trip wrap-up"
      className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 flex items-start gap-3"
    >
      <Plane className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="label-eyebrow text-primary">Welcome back</p>
        <p className="mt-1.5 text-sm text-foreground">
          Your trip to <span className="font-medium">{destShort}</span> ended.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Take a minute to log how it went — any seizures, missed doses, or
          sleep changes — so patterns over time stay accurate.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Link
            to="/journal"
            className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Write trip recap
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-secondary/60"
          >
            Already done
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground p-1 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}