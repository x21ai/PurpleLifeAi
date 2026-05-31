import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Plane, Trash2, Loader2, CalendarDays, Plus, Wand2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { toast } from "sonner";
import { useRouteTheme } from "@/lib/use-route-theme";
import { buildIcs, downloadIcs, medicationToIcsEvents } from "@/lib/ics";
import { useServerFn } from "@tanstack/react-start";
import { generateTripSchedule, previewTripSchedule } from "@/lib/travel.functions";
import { useTranslation } from "react-i18next";
import { DualTime } from "@/components/travel/dual-time";

export const Route = createFileRoute("/_app/settings/travel")({
  head: () => ({ meta: [{ title: "Travel mode — Purple" }] }),
  component: TravelPage,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 pt-16 pb-24">
      <h1 className="font-serif text-3xl text-foreground">Travel mode</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We hit a snag loading your trips. {error?.message ? `(${error.message})` : ""}
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-secondary"
        >
          Try again
        </button>
        <Link
          to="/settings"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-secondary"
        >
          Back to settings
        </Link>
      </div>
    </div>
  ),
});

type Leg = { tz: string; from_at: string; label?: string };

type Trip = {
  id: string;
  label: string | null;
  destination_tz: string;
  depart_at: string;
  return_at: string;
  status: string;
  legs: Leg[] | null;
  shift_strategy: string | null;
  schedule_generated_at: string | null;
};

type LegDraft = { tz: string; localAt: string; label: string };

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
  const { t } = useTranslation();
  const { session } = useAuth();
  const userId = session?.user.id;
  const generateFn = useServerFn(generateTripSchedule);
  const previewFn = useServerFn(previewTripSchedule);
  const [homeTz, setHomeTz] = React.useState<string>("UTC");
  const [trips, setTrips] = React.useState<Trip[] | null>(null);
  const [savingHome, setSavingHome] = React.useState(false);

  const [label, setLabel] = React.useState("");
  const [destinationTz, setDestinationTz] = React.useState("Asia/Hong_Kong");
  const [departAt, setDepartAt] = React.useState("");
  const [returnAt, setReturnAt] = React.useState("");
  const [strategy, setStrategy] = React.useState<"snap" | "gradual" | "home">("gradual");
  const [legs, setLegs] = React.useState<LegDraft[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [generatingId, setGeneratingId] = React.useState<string | null>(null);
  const [previewState, setPreviewState] = React.useState<
    | {
        trip: Trip;
        homeTz: string;
        doses: Array<{
          medication_id: string;
          medication_name: string;
          scheduled_at: string;
          leg_tz: string;
          amount: number | null;
          unit: string | null;
        }>;
      }
    | null
  >(null);
  const [previewingId, setPreviewingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!userId) return;
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
      supabase
        .from("trips")
        .select(
          "id, label, destination_tz, depart_at, return_at, status, legs, shift_strategy, schedule_generated_at",
        )
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
    const { error } = await supabase.from("profiles").update({ timezone: tz }).eq("id", userId);
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
    const legPayload: Leg[] = [
      { tz: homeTz, from_at: depart.toISOString(), label: "Home" },
      ...legs
        .filter((l) => l.tz && l.localAt)
        .map((l) => ({
          tz: l.tz,
          from_at: localInTzToUtc(l.localAt, l.tz),
          label: l.label?.trim() || `Arrive ${l.tz}`,
        })),
    ];
    const status =
      depart.getTime() <= Date.now() && ret.getTime() >= Date.now() ? "active" : "planned";
    const { error } = await supabase.from("trips").insert({
      user_id: userId,
      label: label.trim() || `Travel to ${destinationTz}`,
      destination_tz: destinationTz,
      depart_at: depart.toISOString(),
      return_at: ret.toISOString(),
      legs: legPayload,
      shift_strategy: strategy,
      shift_hours_per_day: 2,
      home_tz_snapshot: homeTz,
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
    setLegs([]);
    toast.success("Trip added. Generate a schedule to populate doses.");
    void load();
  };

  const removeTrip = async (id: string) => {
    await supabase.from("medication_doses").delete().eq("trip_id", id).eq("status", "pending");
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Trip removed");
    void load();
  };

  const generateSchedule = async (trip: Trip) => {
    setGeneratingId(trip.id);
    try {
      const res = await generateFn({ data: { trip_id: trip.id } });
      toast.success(`Generated ${res.generated} dose reminders.`);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate schedule");
    } finally {
      setGeneratingId(null);
    }
  };

  const previewSchedule = async (trip: Trip) => {
    setPreviewingId(trip.id);
    try {
      const res = await previewFn({ data: { trip_id: trip.id } });
      if (res.doses.length === 0) {
        toast.info(
          res.slotCount === 0
            ? "No scheduled medications to preview."
            : "No doses fall inside this trip window.",
        );
        return;
      }
      setPreviewState({ trip, homeTz: res.homeTz, doses: res.doses });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build preview");
    } finally {
      setPreviewingId(null);
    }
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
    const list = (meds ?? []) as Array<{
      id: string;
      name: string;
      dosage: string | null;
      times_of_day: string[] | null;
      is_rescue: boolean;
    }>;
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
    const titleLabel = trip.label ?? `Trip to ${trip.destination_tz}`;
    const ics = buildIcs(`${titleLabel} — Purple`, events);
    downloadIcs(`${titleLabel.replace(/\s+/g, "-").toLowerCase()}-meds`, ics);
    toast.success("Calendar file downloaded.");
  };

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 pb-24">
      <Link
        to="/settings"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground gap-1"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> {t("nav.settings")}
      </Link>
      <h1 className="mt-4 font-serif text-4xl sm:text-5xl text-foreground">{t("travel.title")}</h1>
      <p className="mt-3 text-foreground/75 max-w-[600px]">
        {t("travel.intro")}
      </p>

      <div className="mt-6">
        <a
          href="#plan-a-trip"
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-1.5" /> {t("travel.newTrip")}
        </a>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">{t("travel.homeTz")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The anchor when you're not on a trip. Change this only if you've
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
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          {savingHome && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </section>

      <section id="plan-a-trip" className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6 scroll-mt-20">
        <h2 className="font-serif text-xl text-foreground">Plan a trip</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add each flight or layover. Local times are interpreted in that
          leg's timezone.
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
            <Label htmlFor="trip-dest">Final destination timezone</Label>
            <select
              id="trip-dest"
              value={destinationTz}
              onChange={(e) => setDestinationTz(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {COMMON_TZS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-strategy">Shift strategy</Label>
            <select
              id="trip-strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as typeof strategy)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="gradual">Gradual (shift 2h/day)</option>
              <option value="snap">Snap to local time</option>
              <option value="home">Stay on home time</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-depart">Depart (home local)</Label>
            <Input
              id="trip-depart"
              type="datetime-local"
              value={departAt}
              onChange={(e) => setDepartAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-return">Return (home local)</Label>
            <Input
              id="trip-return"
              type="datetime-local"
              value={returnAt}
              onChange={(e) => setReturnAt(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Legs</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full h-7 px-3 text-xs"
              onClick={() =>
                setLegs((prev) => [...prev, { tz: destinationTz, localAt: "", label: "" }])
              }
            >
              <Plus className="h-3 w-3 mr-1" /> Add leg
            </Button>
          </div>
          {legs.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Optional. Add a leg for each flight or layover — e.g. arrival in
              Dubai at 22:10 local, then Hong Kong at 14:25 local. Without
              legs, Purple uses your final destination from departure.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {legs.map((leg, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-border p-3 grid gap-2 sm:grid-cols-3"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Timezone</Label>
                    <select
                      value={leg.tz}
                      onChange={(e) =>
                        setLegs((prev) =>
                          prev.map((l, j) => (j === i ? { ...l, tz: e.target.value } : l)),
                        )
                      }
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    >
                      {COMMON_TZS.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Arrives (local)</Label>
                    <Input
                      type="datetime-local"
                      value={leg.localAt}
                      onChange={(e) =>
                        setLegs((prev) =>
                          prev.map((l, j) =>
                            j === i ? { ...l, localAt: e.target.value } : l,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Note</Label>
                    <div className="flex gap-2">
                      <Input
                        value={leg.label}
                        placeholder="JFK to HKG"
                        onChange={(e) =>
                          setLegs((prev) =>
                            prev.map((l, j) =>
                              j === i ? { ...l, label: e.target.value } : l,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setLegs((prev) => prev.filter((_, j) => j !== i))}
                        aria-label="Remove leg"
                        className="text-muted-foreground hover:text-destructive p-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4">
          <Button onClick={createTrip} disabled={creating} className="rounded-full">
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plane className="h-4 w-4 mr-2" />
            )}
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
                    {t.destination_tz} ·{" "}
                    {new Date(t.depart_at).toLocaleDateString()} →{" "}
                    {new Date(t.return_at).toLocaleDateString()}
                    {" · "}
                    <span className="capitalize">{t.status}</span>
                    {t.legs && t.legs.length > 1 ? ` · ${t.legs.length} legs` : ""}
                    {t.shift_strategy ? ` · ${t.shift_strategy}` : ""}
                  </p>
                  {t.schedule_generated_at ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Schedule generated {new Date(t.schedule_generated_at).toLocaleString()}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full h-7 px-3 text-xs"
                      onClick={() => void generateSchedule(t)}
                      disabled={generatingId === t.id}
                    >
                      {generatingId === t.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3 mr-1" />
                      )}
                      {t.schedule_generated_at ? "Regenerate schedule" : "Generate schedule"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full h-7 px-3 text-xs"
                      onClick={() => void previewSchedule(t)}
                      disabled={previewingId === t.id}
                    >
                      {previewingId === t.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Eye className="h-3 w-3 mr-1" />
                      )}
                      Preview
                    </Button>
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

      <Dialog
        open={!!previewState}
        onOpenChange={(o) => {
          if (!o) setPreviewState(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Schedule preview
            </DialogTitle>
            <DialogDescription>
              {previewState
                ? `${previewState.doses.length} doses, ${previewState.trip.shift_strategy ?? "snap"} strategy. Nothing has been saved yet.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto -mx-6 px-6 pb-2">
            {previewState && (
              <PreviewBody
                homeTz={previewState.homeTz}
                doses={previewState.doses}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setPreviewState(null)}
              className="rounded-full"
            >
              Close
            </Button>
            <Button
              onClick={async () => {
                if (!previewState) return;
                const trip = previewState.trip;
                setPreviewState(null);
                await generateSchedule(trip);
              }}
              className="rounded-full"
            >
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              Generate now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewBody({
  homeTz,
  doses,
}: {
  homeTz: string;
  doses: Array<{
    medication_id: string;
    medication_name: string;
    scheduled_at: string;
    leg_tz: string;
    amount: number | null;
    unit: string | null;
  }>;
}) {
  // Group by local date in each dose's leg_tz.
  const groups = React.useMemo(() => {
    const m = new Map<string, typeof doses>();
    for (const d of doses) {
      const key = new Intl.DateTimeFormat("en-CA", {
        timeZone: d.leg_tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(d.scheduled_at));
      const arr = m.get(key) ?? [];
      arr.push(d);
      m.set(key, arr);
    }
    return Array.from(m.entries()).sort(([a], [b]) => (a < b ? -1 : 1));
  }, [doses]);

  return (
    <div className="space-y-5 py-3">
      {groups.map(([day, list]) => (
        <div key={day}>
          <p className="label-eyebrow text-muted-foreground">
            {new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
            {list
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.scheduled_at).getTime() -
                  new Date(b.scheduled_at).getTime(),
              )
              .map((d, i) => (
                <li
                  key={`${d.medication_id}-${d.scheduled_at}-${i}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-foreground truncate">{d.medication_name}</p>
                    {d.amount != null && (
                      <p className="text-xs text-muted-foreground">
                        {d.amount} {d.unit ?? ""}
                      </p>
                    )}
                  </div>
                  <DualTime
                    iso={d.scheduled_at}
                    homeTz={homeTz}
                    className="text-foreground/90 text-right shrink-0"
                  />
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Convert datetime-local (wall-clock in `tz`) to UTC ISO. */
function localInTzToUtc(localDateTime: string, tz: string): string {
  if (!localDateTime) return new Date().toISOString();
  const [datePart, timePart] = localDateTime.split("T");
  const naive = new Date(`${datePart}T${timePart}:00Z`);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(naive);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );
  const offsetMin = Math.round((asUtc - naive.getTime()) / 60_000);
  return new Date(naive.getTime() - offsetMin * 60_000).toISOString();
}