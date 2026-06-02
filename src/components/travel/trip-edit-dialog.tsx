import * as React from "react";
import { Loader2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { updateTrip } from "@/lib/travel.functions";
import {
  ItineraryEditor,
  legsAreChronological,
  type LegDraft,
} from "./itinerary-editor";

export type EditableLeg = { tz: string; from_at: string; label?: string };

export type EditableTrip = {
  id: string;
  label: string | null;
  destination_tz: string;
  depart_at: string;
  return_at: string;
  legs: EditableLeg[] | null;
  shift_strategy: string | null;
  schedule_generated_at: string | null;
};

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

/** UTC ISO → "YYYY-MM-DDTHH:mm" in the user's home tz for the datetime-local input. */
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** UTC ISO → datetime-local string interpreted in `tz`. */
function isoToLocalInputInTz(iso: string, tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date(iso));
    const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const hour = g("hour") === "24" ? "00" : g("hour");
    return `${g("year")}-${g("month")}-${g("day")}T${hour}:${g("minute")}`;
  } catch {
    return "";
  }
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

export interface TripEditDialogProps {
  trip: EditableTrip | null;
  homeTz: string;
  onOpenChange: (open: boolean) => void;
  /**
   * Called after a successful save. `regenerateRecommended` is true when
   * dose-affecting fields changed on a trip that already has a generated
   * schedule.
   */
  onSaved: (tripId: string, regenerateRecommended: boolean) => void;
}

export function TripEditDialog({ trip, homeTz, onOpenChange, onSaved }: TripEditDialogProps) {
  const updateFn = useServerFn(updateTrip);
  const [label, setLabel] = React.useState("");
  const [destinationTz, setDestinationTz] = React.useState("Asia/Hong_Kong");
  const [departAt, setDepartAt] = React.useState("");
  const [returnAt, setReturnAt] = React.useState("");
  const [strategy, setStrategy] = React.useState<"snap" | "gradual" | "home">("snap");
  const [legs, setLegs] = React.useState<LegDraft[]>([]);
  const [saving, setSaving] = React.useState(false);

  // Reset state whenever the open trip changes.
  React.useEffect(() => {
    if (!trip) return;
    setLabel(trip.label ?? "");
    setDestinationTz(trip.destination_tz);
    setDepartAt(isoToLocalInput(trip.depart_at));
    setReturnAt(isoToLocalInput(trip.return_at));
    setStrategy(
      ((trip.shift_strategy ?? "snap") as "snap" | "gradual" | "home"),
    );
    const seeded: LegDraft[] = (trip.legs ?? [])
      .filter((l) => l && l.tz !== homeTz) // skip the implicit "home" anchor
      .map((l) => ({
        tz: l.tz,
        localAt: isoToLocalInputInTz(l.from_at, l.tz),
        label: l.label ?? "",
      }));
    setLegs(seeded);
  }, [trip, homeTz]);

  const chronological = legsAreChronological(legs);
  const canSave = !!trip && !!departAt && !!returnAt && chronological && !saving;

  const save = async () => {
    if (!trip) return;
    if (!canSave) {
      if (!chronological) toast.error("Legs are out of order. Reorder before saving.");
      return;
    }
    setSaving(true);
    try {
      const depart = new Date(departAt);
      const ret = new Date(returnAt);
      if (!(depart.getTime() < ret.getTime())) {
        toast.error("Return must be after departure");
        setSaving(false);
        return;
      }
      const legPayload = [
        { tz: homeTz, from_at: depart.toISOString(), label: "Home" },
        ...legs
          .filter((l) => l.tz && l.localAt)
          .map((l) => ({
            tz: l.tz,
            from_at: localInTzToUtc(l.localAt, l.tz),
            label: l.label?.trim() || `Arrive ${l.tz}`,
          })),
      ];
      const res = await updateFn({
        data: {
          id: trip.id,
          label: label.trim() || null,
          destination_tz: destinationTz,
          depart_at: depart.toISOString(),
          return_at: ret.toISOString(),
          legs: legPayload,
          shift_strategy: strategy,
        },
      });
      toast.success("Trip updated");
      const recommend = res.doseAffectingChanged && res.hasSchedule;
      onOpenChange(false);
      onSaved(trip.id, recommend);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save trip");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!trip} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Edit trip</DialogTitle>
          <DialogDescription>
            Changes to dates, timezone, strategy, or legs may need a fresh
            dose schedule — you'll be asked before anything is replaced.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4 pb-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="edit-trip-label">Label</Label>
              <Input
                id="edit-trip-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Hong Kong work trip"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-trip-dest">Final destination timezone</Label>
              <select
                id="edit-trip-dest"
                value={destinationTz}
                onChange={(e) => setDestinationTz(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {[destinationTz, ...COMMON_TZS.filter((tz) => tz !== destinationTz)].map(
                  (tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-trip-strategy">Shift strategy</Label>
              <select
                id="edit-trip-strategy"
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
              <Label htmlFor="edit-trip-depart">Depart (home local)</Label>
              <Input
                id="edit-trip-depart"
                type="datetime-local"
                value={departAt}
                onChange={(e) => setDepartAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-trip-return">Return (home local)</Label>
              <Input
                id="edit-trip-return"
                type="datetime-local"
                value={returnAt}
                onChange={(e) => setReturnAt(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Legs</h3>
            </div>
            <ItineraryEditor
              value={legs}
              onChange={setLegs}
              defaultTz={destinationTz}
              hideHeading
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave} className="rounded-full">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}