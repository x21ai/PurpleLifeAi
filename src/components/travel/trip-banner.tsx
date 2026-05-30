import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Plane, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";

const DISMISS_KEY = "purple-trip-banner-dismissed-tz";

type Profile = { timezone: string | null };
type ActiveTrip = { id: string; destination_tz: string } | null;

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
        .select("id, destination_tz, depart_at, return_at, status")
        .lte("depart_at", new Date().toISOString())
        .gte("return_at", new Date().toISOString())
        .neq("status", "cancelled")
        .limit(1),
    ]);
    setProfile((p as Profile) ?? { timezone: null });
    const t = (trips ?? [])[0];
    setActiveTrip(t ? { id: t.id, destination_tz: t.destination_tz } : null);
  }, [userId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!userId || !deviceTz) return null;
  const homeTz = profile?.timezone ?? null;

  // Active trip → show a slim travel pill instead of the prompt.
  if (activeTrip) {
    return (
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs text-foreground">
        <Plane className="h-3.5 w-3.5 text-primary" />
        <span>Travel mode · doses anchored to home time</span>
        <Link
          to="/settings/travel"
          className="text-primary underline-offset-2 hover:underline"
        >
          Manage
        </Link>
      </div>
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