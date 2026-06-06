import * as React from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type LegDraft = { tz: string; localAt: string; label: string };

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

/**
 * Returns true if all legs that have a localAt are in chronological order.
 * Empty/blank localAt entries are skipped (they're not valid yet anyway).
 */
export function legsAreChronological(legs: LegDraft[]): boolean {
  let prev = -Infinity;
  for (const l of legs) {
    if (!l.localAt) continue;
    const t = new Date(l.localAt).getTime();
    if (!Number.isFinite(t)) return false;
    if (t < prev) return false;
    prev = t;
  }
  return true;
}

/**
 * Per-row out-of-order flag: row i is flagged if its localAt is earlier than
 * any prior row's localAt. Used to highlight the offending row inline.
 */
export function findOutOfOrder(legs: LegDraft[]): boolean[] {
  const flags: boolean[] = [];
  let prev = -Infinity;
  for (const l of legs) {
    if (!l.localAt) {
      flags.push(false);
      continue;
    }
    const t = new Date(l.localAt).getTime();
    const bad = !Number.isFinite(t) || t < prev;
    flags.push(bad);
    if (!bad) prev = t;
  }
  return flags;
}

export interface ItineraryEditorProps {
  value: LegDraft[];
  onChange: (next: LegDraft[]) => void;
  defaultTz: string;
  /** Hide the section heading when embedded inside a parent that already has one. */
  hideHeading?: boolean;
}

export function ItineraryEditor({
  value,
  onChange,
  defaultTz,
  hideHeading,
}: ItineraryEditorProps) {
  const flags = React.useMemo(() => findOutOfOrder(value), [value]);

  const update = (i: number, patch: Partial<LegDraft>) =>
    onChange(value.map((l, j) => (i === j ? { ...l, ...patch } : l)));
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = value.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () =>
    onChange([...value, { tz: defaultTz, localAt: "", label: "" }]);

  return (
    <div>
      {!hideHeading && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Legs</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full h-7 px-3 text-xs"
            onClick={add}
          >
            <Plus className="h-3 w-3 mr-1" /> Add leg
          </Button>
        </div>
      )}
      {hideHeading && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full h-7 px-3 text-xs"
            onClick={add}
          >
            <Plus className="h-3 w-3 mr-1" /> Add leg
          </Button>
        </div>
      )}

      {value.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Optional. Add a leg for each flight or layover, e.g. arrival in
          Dubai at 22:10 local, then Hong Kong at 14:25 local. Without legs,
          Purple uses your final destination from departure.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {value.map((leg, i) => {
            const bad = flags[i];
            return (
              <li
                key={i}
                className={`rounded-xl border p-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] ${
                  bad ? "border-destructive/50 bg-destructive/5" : "border-border"
                }`}
              >
                <div className="space-y-1">
                  <Label className="text-xs">Timezone</Label>
                  <select
                    value={leg.tz}
                    onChange={(e) => update(i, { tz: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    {[leg.tz, ...COMMON_TZS.filter((tz) => tz !== leg.tz)].map(
                      (tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Arrives (local)</Label>
                  <Input
                    type="datetime-local"
                    value={leg.localAt}
                    onChange={(e) => update(i, { localAt: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Note</Label>
                  <Input
                    value={leg.label}
                    placeholder="JFK to HKG"
                    onChange={(e) => update(i, { label: e.target.value })}
                  />
                </div>
                <div className="flex sm:flex-col items-center justify-end gap-1 sm:gap-0.5 sm:pt-5">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move leg up"
                    className="text-muted-foreground hover:text-foreground p-1 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label="Move leg down"
                    className="text-muted-foreground hover:text-foreground p-1 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label="Remove leg"
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {bad && (
                  <p className="sm:col-span-4 flex items-center gap-1.5 text-[11px] text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    This leg is earlier than the one above. Reorder or fix the
                    time before saving.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}