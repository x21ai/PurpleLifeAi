import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Plane, Trash2, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";
import { buildIcs, downloadIcs, medicationToIcsEvents } from "@/lib/ics";

export const Route = createFileRoute("/_app/settings/travel")({
  head: () => ({ meta: [{ title: "Travel mode — Purple" }] }),
  component: TravelPage,
});

type Trip = {
  id: string;
  label: string | null;
  destination_tz: string;
  depart_at: string;
  return_at: string;
  status: string;
};

// Common timezone choices. Falls back to free-text input below.
const COMMON_TZS = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

function TravelPage() {
  useRouteTheme("light");
  const { session } = useAuth();
  const userId = session?.user.id;
  const [homeTz, setHomeTz] = React.useState<string>("UTC");
  const [trips, setTrips] = React.useState<Trip[] | null>(null);
  const [savingHome, setSavingHome] = React.useState(false);

  // form state
  const [label, setLabel] = React.useState("");
  const [destinationTz, setDestinationTz] = React.useState("Asia/Hong_Kong");
  const [departAt, setDepartAt] = React.useState("");
  const [returnAt, setReturnAt] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
      supabase
        .from("trips")
        .select("id, label, destination_tz, depart_at, return_at, status")
        .order("depart_at", { ascending: true }),
    ]);
    setHomeTz(p?.timezone ?? "UTC");
    setTrips((t as Trip[]) ?? []);
  }, [userId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const saveHome = async (tz: string) => {
    if (!userId) return;
    setSavingHome(true);
    const { error } = await supabase
      .from("profiles")
      .update({ timezone: tz })
      .eq("id", userId);
    if (!error) {
      await supabase.rpc("regenerate_today_pending_doses", { _user_id: userId });
    }
    setSavingHome(false);
    if (error) {
      toast.error("Could not update home timezone");
      return;
    }
    setHomeTz(tz);
    toast.success("Home timezone updated");
  };

  const createTrip = async () => {
    if (!userId) return;
    if (!destinationTz || !departAt || !returnAt) {
      toast.error("Pick a destination and dates");
      return;
    }
    const depart = new Date(departAt);
    const ret = new Date(returnAt);
    if (!(depart.getTime() < ret.getTime())) {
      toast.error("Return must be after departure");
      return;
    }
    setCreating(true);
    const status = depart.getTime() <= Date.now() && ret.getTime() >= Date.now() ? "active" : "planned";
    const { error } = await supabase.from("trips").insert({
      user_id: userId,
      label: label.trim() || `Travel to ${destinationTz}`,
      destination_tz: destinationTz,
      depart_at: depart.toISOString(),
      return_at: ret.toISOString(),
      status,
    });
    setCreating(false);
    if (error) {
      toast.error("Could not save trip");
      return;
    }
    setLabel("");
    setDepartAt("");
    setReturnAt("");
    toast.success("Trip added");
    void load();
  };

  const removeTrip = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Trip removed");
    void load();
  };

  const exportTripToCalendar = async (trip: Trip) => {
    if (!userId) return;
    const { data: meds, error } = await supabase
      .from("medications")
      .select("id, name, dosage, times_of_day, is_rescue")
      .eq("user_id", userId)
      .eq("active", true);
    if (error) {
      toast.error("Could not load medications");
      return;
    }
    const list = (meds ?? []) as Array<{ id: string; name: string; dosage: string | null; times_of_day: string[] | null; is_rescue: boolean }>;
    const depart = new Date(trip.depart_at);
    const ret = new Date(trip.return_at);
    const days = Math.max(1, Math.ceil((ret.getTime() - depart.getTime()) / (1000 * 60 * 60 * 24)));
    const startDate = depart.toISOString().slice(0, 10);
    const events = list
      .filter((m) => !m.is_rescue && (m.times_of_day?.length ?? 0) > 0)
      .flatMap((m) =>
        medicationToIcsEvents({
          medId: m.id,
          medName: m.name,
          dosage: m.dosage,
          timesOfDay: m.times_of_day ?? [],
          days,
          startDate,
          homeTz,
        }),
      );
    if (events.length === 0) {
      toast.error("No scheduled medications to export for this trip.");
      return;
    }
    const label = trip.label ?? `Trip to ${trip.destination_tz}`;
    const ics = buildIcs(`${label} — Purple`, events);
    downloadIcs(`${label.replace(/\s+/g, "-").toLowerCase()}-meds`, ics);
    toast.success("Calendar file downloaded. Open it to add to Apple or Google Calendar.");
  };

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 pb-24">
      <Link
        to="/settings"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground gap-1"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Settings
      </Link>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground">Travel mode</h1>
      <p className="mt-3 text-foreground/75 max-w-[600px]">
        Doses always stay on your <em>home</em> time, no matter what timezone
        you're in. A dose set for 10 AM in your home zone stays at 10 AM home
        time — we just show it in local time on your watch so you know when to
        take it.
      </p>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Home timezone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The anchor for every scheduled dose. Change this only if you've
          actually moved.
        </p>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <select
            value={homeTz}
            onChange={(e) => void saveHome(e.target.value)}
            disabled={savingHome}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {[homeTz, ...COMMON_TZS.filter((t) => t !== homeTz)].map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          {savingHome && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Plan a trip</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell Purple where and when. We'll show every dose in both local and
          home time while you're away.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="trip-label">Label (optional)</Label>
            <Input
              id="trip-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Hong Kong work trip"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-dest">Destination timezone</Label>
            <select
              id="trip-dest"
              value={destinationTz}
              onChange={(e) => setDestinationTz(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {COMMON_TZS.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-depart">Depart</Label>
            <Input
              id="trip-depart"
              type="datetime-local"
              value={departAt}
              onChange={(e) => setDepartAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-return">Return</Label>
            <Input
              id="trip-return"
              type="datetime-local"
              value={returnAt}
              onChange={(e) => setReturnAt(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={createTrip} disabled={creating} className="rounded-full">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plane className="h-4 w-4 mr-2" />}
            Add trip
          </Button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Trips</h2>
        {trips === null ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : trips.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No trips yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {trips.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {t.label ?? `Trip to ${t.destination_tz}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.destination_tz} · {new Date(t.depart_at).toLocaleDateString()} → {new Date(t.return_at).toLocaleDateString()}
                    {" · "}
                    <span className="capitalize">{t.status}</span>
                  </p>
                  <div className="mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full h-7 px-3 text-xs"
                      onClick={() => void exportTripToCalendar(t)}
                    >
                      <CalendarDays className="h-3 w-3 mr-1" /> Export to calendar
                    </Button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeTrip(t.id)}
                  aria-label="Delete trip"
                  className="text-muted-foreground hover:text-destructive p-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}