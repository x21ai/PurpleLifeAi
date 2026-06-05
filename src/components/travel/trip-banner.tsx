import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Plane, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { DualTime } from "./dual-time";

const DISMISS_KEY = "purple-trip-banner-dismissed-tz";

type Profile = { timezone: string | null };
type Leg = { tz: string; from_at: string; label?: string };
type ActiveTrip = {
  id: string;
  destination_tz: string;
  legs: Leg[] | null;
  home_tz_snapshot: string | null;
  return_at: string;
  shift_strategy: "home" | "snap" | "gradual" | null;
  shift_hours_per_day: number | null;
} | null;
type NextDose = { scheduled_at: string; medication_name: string } | null;

/**
 * Shown on Today when the device timezone differs from the user's stored home
 * timezone and there isn't already an active trip. Lets them either start
 * travel mode (which anchors meds to home time) or update their home tz if
 * they actually moved.
 */
export function TripBanner() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [activeTrip, setActiveTrip] = React.useState<ActiveTrip>(null);
  const [nextDose, setNextDose] = React.useState<NextDose>(null);
  const [deviceTz, setDeviceTz] = React.useState<string | null>(null);
  const [dismissedFor, setDismissedFor] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setDeviceTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setDeviceTz(null);
    }
    setDismissedFor(localStorage.getItem(DISMISS_KEY));
  }, []);

  const refresh = React.useCallback(async () => {
    if (!userId) return;
    const [{ data: p }, { data: trips }] = await Promise.all([
      supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
      supabase
        .from("trips")
        .select(
          "id, destination_tz, depart_at, return_at, status, legs, home_tz_snapshot, shift_strategy, shift_hours_per_day",
        )
        .lte("depart_at", new Date().toISOString())
        .gte("return_at", new Date().toISOString())
        .neq("status", "cancelled")
        .limit(1),
    ]);
    setProfile((p as Profile) ?? { timezone: null });
    const t = (trips ?? [])[0];
    setActiveTrip(
      t
        ? {
            id: t.id,
            destination_tz: t.destination_tz,
            legs: (t.legs as Leg[] | null) ?? null,
            home_tz_snapshot: t.home_tz_snapshot ?? null,
            return_at: t.return_at,
            shift_strategy:
              (t.shift_strategy as "home" | "snap" | "gradual" | null) ?? null,
            shift_hours_per_day:
              typeof t.shift_hours_per_day === "number" ? t.shift_hours_per_day : null,
          }
        : null,
    );
    if (t) {
      const { data: dose } = await supabase
        .from("medication_doses")
        .select("scheduled_at, medications(name)")
        .eq("user_id", userId)
        .eq("status", "pending")
        .gte("scheduled_at", new Date().toISOString())
        .lte("scheduled_at", t.return_at)
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      setNextDose(
        dose
          ? {
              scheduled_at: dose.scheduled_at,
              medication_name:
                (dose as { medications?: { name?: string } }).medications?.name ?? "Next dose",
            }
          : null,
      );
    } else {
      setNextDose(null);
    }
  }, [userId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!userId || !deviceTz) return null;
  const homeTz = profile?.timezone ?? null;

  // Active trip → show a richer card with active leg + next dose dual time.
  if (activeTrip) {
    const homeTz = activeTrip.home_tz_snapshot ?? profile?.timezone ?? null;
    const legs = (activeTrip.legs ?? []).slice().sort(
      (a, b) => new Date(a.from_at).getTime() - new Date(b.from_at).getTime(),
    );
    const nowMs = Date.now();
    const active = legs.filter((l) => new Date(l.from_at).getTime() <= nowMs).pop();
    const currentTz = active?.tz ?? activeTrip.destination_tz;
    const currentLabel = active?.label?.trim() || shortCity(currentTz);
    // Leg-transition nudge: highlight if we landed in this leg within the last 12h.
    const justLanded =
      active && active.tz !== (activeTrip.home_tz_snapshot ?? profile?.timezone ?? "")
        ? nowMs - new Date(active.from_at).getTime() < 12 * 60 * 60 * 1000
        : false;
    const offsetVsHome = homeTz ? tzOffsetDiffHours(currentTz, homeTz) : null;
    const strategyNudge = strategyText(
      activeTrip.shift_strategy,
      activeTrip.shift_hours_per_day,
    );
    return (
      <aside
        aria-label="Travel mode active"
        className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-primary">
              <Plane className="h-3.5 w-3.5" />
              <p className="label-eyebrow text-primary">
                {justLanded ? "Just landed" : "Travel mode"}
              </p>
            </div>
            <p className="mt-2 text-sm text-foreground">
              {justLanded ? "You're now in " : "You're in "}
              <span className="font-medium">{currentLabel}</span>
              <span className="text-muted-foreground"> · {currentTz}</span>
              {offsetVsHome !== null && offsetVsHome !== 0 && (
                <span className="text-muted-foreground">
                  {" "}· {offsetVsHome > 0 ? "+" : ""}
                  {offsetVsHome}h from home
                </span>
              )}
            </p>
            {strategyNudge && (
              <p className="mt-1 text-xs text-muted-foreground">{strategyNudge}</p>
            )}
            {nextDose ? (
              <p className="mt-1.5 text-sm text-foreground/80 flex flex-wrap items-baseline gap-x-2">
                <span className="text-muted-foreground">Next dose</span>
                <span className="font-medium">{nextDose.medication_name}</span>
                <DualTime iso={nextDose.scheduled_at} homeTz={homeTz} />
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">
                No upcoming doses in this trip window.
              </p>
            )}
            {legs.length <= 1 && (
              <Link
                to="/settings/travel"
                className="mt-2 inline-flex items-center text-xs text-primary underline-offset-2 hover:underline"
              >
                + Add itinerary
              </Link>
            )}
          </div>
          <Link
            to="/settings/travel"
            className="text-xs text-primary underline-offset-2 hover:underline shrink-0"
          >
            Manage
          </Link>
        </div>
      </aside>
    );
  }

  if (!homeTz || homeTz === deviceTz) return null;
  if (dismissedFor === deviceTz) return null;

  const startTrip = async () => {
    if (!userId) return;
    setBusy(true);
    // Auto-create a one-week active trip ending in 7 days. User can edit in Settings.
    const depart = new Date();
    const ret = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const { error } = await supabase.from("trips").insert({
      user_id: userId,
      destination_tz: deviceTz,
      depart_at: depart.toISOString(),
      return_at: ret.toISOString(),
      label: `Travel to ${deviceTz}`,
      status: "active",
    });
    setBusy(false);
    if (error) {
      toast.error("Could not start travel mode");
      return;
    }
    toast.success("Travel mode on — doses stay on home time");
    void refresh();
  };

  const updateHome = async () => {
    if (!userId) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ timezone: deviceTz })
      .eq("id", userId);
    if (!error) {
      await supabase.rpc("regenerate_today_pending_doses", { _user_id: userId });
    }
    setBusy(false);
    if (error) {
      toast.error("Could not update home timezone");
      return;
    }
    toast.success("Home timezone updated");
    void refresh();
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, deviceTz);
    setDismissedFor(deviceTz);
  };

  return (
    <aside
      role="note"
      aria-label="Timezone change detected"
      className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
    >
      <Plane className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          Looks like you're in <span className="font-medium">{deviceTz}</span>.
          Your home is <span className="font-medium">{homeTz}</span>.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Travel mode keeps each dose at its original home time (so the gap
          between doses stays the same). Update home only if you've moved.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startTrip}
            disabled={busy}
            className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            Start travel mode
          </button>
          <button
            type="button"
            onClick={updateHome}
            disabled={busy}
            className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-secondary/60 disabled:opacity-50"
          >
            I moved — update home
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

/** "America/New_York" → "New York"; falls back to last segment of the tz id. */
function shortCity(tz: string): string {
  const last = tz.split("/").pop() ?? tz;
  return last.replace(/_/g, " ");
}

/** Difference in hours between `tz` and `homeTz` at the current instant. */
function tzOffsetDiffHours(tz: string, homeTz: string): number | null {
  try {
    const at = new Date();
    const off = (zone: string) => {
      const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const parts = dtf.formatToParts(at);
      const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
      const asUtc = Date.UTC(
        g("year"),
        g("month") - 1,
        g("day"),
        g("hour") === 24 ? 0 : g("hour"),
        g("minute"),
        g("second"),
      );
      return Math.round((asUtc - at.getTime()) / 60_000);
    };
    return Math.round((off(tz) - off(homeTz)) / 60);
  } catch {
    return null;
  }
}

/** Plain-language nudge derived from the trip's shift strategy. */
function strategyText(
  strategy: "home" | "snap" | "gradual" | null,
  hoursPerDay: number | null,
): string | null {
  if (!strategy) return null;
  if (strategy === "snap") return "On destination time now.";
  if (strategy === "home") return "Staying on home time.";
  if (strategy === "gradual") {
    const h = hoursPerDay && hoursPerDay > 0 ? hoursPerDay : 2;
    return `Shifting ${h}h/day toward destination time.`;
  }
  return null;
}