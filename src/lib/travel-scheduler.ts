/**
 * Itinerary-aware medication schedule generator.
 *
 * Given the user's home schedule (HH:MM slots per medication, anchored to home
 * timezone) and an ordered list of trip "legs" (each leg = a timezone the
 * traveler is in starting from a given UTC instant), produce a flat list of
 * dose instants to materialize into `medication_doses`.
 *
 * Strategies:
 *  - "home":   always interpret HH:MM in the home tz (gap between doses unchanged)
 *  - "snap":   interpret HH:MM in whichever leg's tz is active that day
 *  - "gradual": shift the home HH:MM by `shiftHoursPerDay` per day after arrival
 *               until aligned with the destination leg, then snap.
 *
 * Pure functions, no I/O. Tested via the server fn that calls it.
 */

export type TripLeg = {
  /** IANA timezone the traveler is in during this leg. */
  tz: string;
  /** UTC instant when this leg begins. */
  from_at: string;
  /** Optional human label, e.g. "JFK → HKG". */
  label?: string;
};

export type ShiftStrategy = "home" | "snap" | "gradual";

export type MedSlot = {
  medication_id: string;
  /** "HH:MM" 24h, anchored to home tz. */
  time: string;
  amount: number | null;
  unit: string | null;
};

export type GeneratedDose = {
  medication_id: string;
  scheduled_at: string; // ISO UTC
  amount: number | null;
  unit: string | null;
  leg_tz: string;
};

/** Add N days (UTC) without DST drama. */
function addDaysUTC(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

/** Format a Date as YYYY-MM-DD in the given tz. */
function dateKeyInTz(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

/**
 * Resolve "YYYY-MM-DD HH:MM" as a wall-clock time in `tz` and return the
 * corresponding UTC Date. Uses Intl to compute the offset.
 */
export function wallTimeInTzToUtc(dateKey: string, hhmm: string, tz: string): Date {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return new Date(NaN);
  // Start with naive UTC interpretation, then correct by the tz's offset.
  const naiveUtc = new Date(`${dateKey}T${pad(h)}:${pad(m)}:00Z`);
  const offsetMin = tzOffsetMinutes(naiveUtc, tz);
  return new Date(naiveUtc.getTime() - offsetMin * 60_000);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Minutes east of UTC for `tz` at instant `at`. */
function tzOffsetMinutes(at: Date, tz: string): number {
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
  const parts = dtf.formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") === 24 ? 0 : get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - at.getTime()) / 60_000);
}

/** Pick the active leg for a given UTC instant. */
function activeLegAt(legs: TripLeg[], at: Date): TripLeg {
  let active = legs[0];
  for (const leg of legs) {
    if (new Date(leg.from_at).getTime() <= at.getTime()) active = leg;
    else break;
  }
  return active;
}

export type GenerateInput = {
  homeTz: string;
  departAt: string; // ISO UTC
  returnAt: string; // ISO UTC
  legs: TripLeg[];
  slots: MedSlot[];
  strategy: ShiftStrategy;
  shiftHoursPerDay: number;
};

export function generateTripDoses(input: GenerateInput): GeneratedDose[] {
  const { homeTz, departAt, returnAt, legs, slots, strategy, shiftHoursPerDay } = input;
  if (slots.length === 0) return [];
  const sortedLegs = [...(legs ?? [])].sort(
    (a, b) => new Date(a.from_at).getTime() - new Date(b.from_at).getTime(),
  );
  // Ensure there's always a starting leg = home.
  const effectiveLegs: TripLeg[] =
    sortedLegs.length > 0 && new Date(sortedLegs[0].from_at).getTime() <= new Date(departAt).getTime()
      ? sortedLegs
      : [{ tz: homeTz, from_at: departAt, label: "Home" }, ...sortedLegs];

  const start = new Date(departAt);
  const end = new Date(returnAt);
  const out: GeneratedDose[] = [];

  // Iterate calendar days based on leg-local date so each day is processed once.
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;

  for (let i = 0; i < totalDays; i++) {
    // Anchor the day at the start of the local day in the active leg's tz.
    const dayProbeUtc = addDaysUTC(start, i);
    const leg = activeLegAt(effectiveLegs, dayProbeUtc);
    const interpretTz = strategy === "home" ? homeTz : leg.tz;
    const dateKey = dateKeyInTz(dayProbeUtc, interpretTz);

    for (const slot of slots) {
      let hhmm = slot.time;
      if (strategy === "gradual" && leg.tz !== homeTz) {
        // Gradually drift the home HH:MM toward the destination wall time.
        const arrivedAt = new Date(leg.from_at);
        const daysSinceArrival = Math.max(
          0,
          Math.floor((dayProbeUtc.getTime() - arrivedAt.getTime()) / 86_400_000),
        );
        const homeOffset = tzOffsetMinutes(dayProbeUtc, homeTz);
        const legOffset = tzOffsetMinutes(dayProbeUtc, leg.tz);
        const diffMin = legOffset - homeOffset; // minutes to shift wall clock to align
        const stepMin = shiftHoursPerDay * 60;
        const totalShiftMin =
          Math.sign(diffMin) *
          Math.min(Math.abs(diffMin), daysSinceArrival * stepMin);
        const [h, m] = hhmm.split(":").map(Number);
        const shifted = (h * 60 + m + totalShiftMin + 24 * 60) % (24 * 60);
        hhmm = `${pad(Math.floor(shifted / 60))}:${pad(shifted % 60)}`;
      }
      const at = wallTimeInTzToUtc(dateKey, hhmm, interpretTz);
      if (isNaN(at.getTime())) continue;
      if (at.getTime() < start.getTime() || at.getTime() > end.getTime()) continue;
      out.push({
        medication_id: slot.medication_id,
        scheduled_at: at.toISOString(),
        amount: slot.amount,
        unit: slot.unit,
        leg_tz: interpretTz,
      });
    }
  }

  // De-dupe by (med, instant), DST edges or overlapping legs can produce ties.
  const seen = new Set<string>();
  return out.filter((d) => {
    const key = `${d.medication_id}|${d.scheduled_at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}