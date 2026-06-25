import { supabase } from "@/integrations/supabase/client";

export type TodayDoseRow = {
  id: string;
  scheduled_at: string;
  status: string;
  amount: number | null;
  unit: string | null;
  medication: {
    id: string;
    name: string;
    dosage: string | null;
    kind: string;
    is_rescue: boolean;
  } | null;
};

const STATUS_RANK: Record<string, number> = {
  taken: 4,
  missed: 3,
  skipped: 2,
  pending: 1,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Resolve profile timezone with browser fallback, then UTC. */
export function resolveUserTimezone(profileTz: string | null | undefined): string {
  if (profileTz && profileTz.trim()) return profileTz.trim();
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Convert a (date, HH:MM) interpreted in `tz` into an absolute UTC Date.
 * Mirrors the home-tz anchoring in src/lib/ics.ts.
 */
function tzLocalToUtc(dateStr: string, time: string, tz: string): Date | null {
  try {
    const [h, m] = time.split(":").map((n) => parseInt(n, 10));
    const naive = new Date(`${dateStr}T${pad(h)}:${pad(m)}:00Z`);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = Object.fromEntries(
      fmt
        .formatToParts(naive)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    const asTz = Date.UTC(
      parseInt(parts.year, 10),
      parseInt(parts.month, 10) - 1,
      parseInt(parts.day, 10),
      parseInt(parts.hour === "24" ? "0" : parts.hour, 10),
      parseInt(parts.minute, 10),
      parseInt(parts.second, 10),
    );
    const offset = asTz - naive.getTime();
    return new Date(naive.getTime() - offset);
  } catch {
    return null;
  }
}

/** Today's date as YYYY-MM-DD in the given timezone. */
export function todayStringForTimezone(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Human label (e.g. "Thursday, June 18, 2026") for a YYYY-MM-DD date in tz. */
export function dateLabelForTimezone(dateStr: string, tz: string): string {
  // Anchor at noon UTC of that calendar date to avoid tz roll-over on the label.
  const anchor = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(anchor);
}

/** Start/end of a given calendar date in the user's timezone, as UTC ISO bounds. */
export function dayWindowForTimezone(
  tz: string,
  dateStr: string,
): { startIso: string; endIso: string; label: string } {
  const start = tzLocalToUtc(dateStr, "00:00", tz) ?? new Date();
  const endBase = tzLocalToUtc(dateStr, "23:59", tz) ?? new Date();
  const end = new Date(endBase.getTime() + 59_999);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: dateLabelForTimezone(dateStr, tz),
  };
}

/** Start/end of today in the user's timezone, as UTC ISO bounds for DB queries. */
export function todayWindowForTimezone(tz: string): {
  startIso: string;
  endIso: string;
  todayLabel: string;
} {
  const todayStr = todayStringForTimezone(tz);
  const { startIso, endIso, label } = dayWindowForTimezone(tz, todayStr);
  return { startIso, endIso, todayLabel: label };
}

export function formatDoseLocalTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function doseSlotKey(d: TodayDoseRow, tz: string): string {
  // Collapse by visible identity (med name + local time) so duplicate
  // medication rows with the same name and/or duplicate dose rows from
  // regenerate races don't show up as multiple lines on the Today list.
  const name = (d.medication?.name ?? "").trim().toLowerCase();
  const fallback = d.medication?.id ?? d.id;
  const time = formatDoseLocalTime(d.scheduled_at, tz);
  return `${name || fallback}|${time}`;
}

/** Collapse duplicate rows for the same med + local time; prefer taken over pending. */
export function dedupeTodayDoses(doses: TodayDoseRow[], tz: string): TodayDoseRow[] {
  const map = new Map<string, TodayDoseRow>();
  for (const d of doses) {
    const key = doseSlotKey(d, tz);
    const existing = map.get(key);
    const rank = STATUS_RANK[d.status] ?? 0;
    const existingRank = existing ? (STATUS_RANK[existing.status] ?? 0) : -1;
    if (!existing || rank > existingRank) map.set(key, d);
  }
  return [...map.values()].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}

export async function fetchProfileTimezone(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", userId)
    .maybeSingle();
  return resolveUserTimezone((data?.timezone as string | null) ?? null);
}

export function isScheduledDose(d: TodayDoseRow): boolean {
  return !!d.medication && d.medication.kind !== "rescue" && !d.medication.is_rescue;
}

/** Regenerate pending dose rows for today, then fetch them in profile timezone. */
export async function ensureTodayDoses(userId: string): Promise<{
  doses: TodayDoseRow[];
  timezone: string;
  todayLabel: string;
}> {
  const tz = await fetchProfileTimezone(userId);
  const { startIso, endIso, todayLabel } = todayWindowForTimezone(tz);

  await supabase.rpc("regenerate_today_pending_doses", { _user_id: userId });

  const { data, error } = await supabase
    .from("medication_doses")
    .select(
      "id, scheduled_at, status, amount, unit, medication:medications(id, name, dosage, kind, is_rescue)",
    )
    .eq("user_id", userId)
    .gte("scheduled_at", startIso)
    .lte("scheduled_at", endIso)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  const raw = ((data as unknown as TodayDoseRow[]) ?? []).filter(isScheduledDose);
  const doses = dedupeTodayDoses(raw, tz);
  return { doses, timezone: tz, todayLabel };
}

export type DoseHistoryDay = {
  date: string;
  label: string;
  doses: TodayDoseRow[];
  takenCount: number;
  total: number;
};

/**
 * Fetch the last `days` of scheduled doses grouped by the user's local
 * calendar day (most recent first). Read-only, used by the history page.
 */
export async function getDoseHistoryByDay(
  userId: string,
  days = 30,
): Promise<{ groups: DoseHistoryDay[]; timezone: string }> {
  const tz = await fetchProfileTimezone(userId);
  const todayStr = todayStringForTimezone(tz);
  const start = tzLocalToUtc(shiftDateStr(todayStr, -(days - 1)), "00:00", tz) ?? new Date();
  const endBase = tzLocalToUtc(todayStr, "23:59", tz) ?? new Date();
  const end = new Date(endBase.getTime() + 59_999);

  const { data, error } = await supabase
    .from("medication_doses")
    .select(
      "id, scheduled_at, status, amount, unit, medication:medications(id, name, dosage, kind, is_rescue)",
    )
    .eq("user_id", userId)
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: false });
  if (error) throw error;

  const raw = ((data as unknown as TodayDoseRow[]) ?? []).filter(isScheduledDose);
  const dateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const byDay = new Map<string, TodayDoseRow[]>();
  for (const d of raw) {
    const key = dateFmt.format(new Date(d.scheduled_at));
    const arr = byDay.get(key) ?? [];
    arr.push(d);
    byDay.set(key, arr);
  }

  const groups: DoseHistoryDay[] = [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, rows]) => {
      const deduped = dedupeTodayDoses(rows, tz);
      return {
        date,
        label: dateLabelForTimezone(date, tz),
        doses: deduped,
        takenCount: deduped.filter((d) => d.status === "taken").length,
        total: deduped.length,
      };
    });

  return { groups, timezone: tz };
}

/** Shift a YYYY-MM-DD string by whole days (calendar-safe via UTC noon). */
function shiftDateStr(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch (without regenerating) the scheduled doses for an arbitrary calendar
 * date in the user's timezone. Used for past-day navigation so we never
 * fabricate dose rows for days that already happened.
 */
export async function getDosesForDate(
  userId: string,
  dateStr: string,
): Promise<{ doses: TodayDoseRow[]; timezone: string; label: string }> {
  const tz = await fetchProfileTimezone(userId);
  const { startIso, endIso, label } = dayWindowForTimezone(tz, dateStr);

  const { data, error } = await supabase
    .from("medication_doses")
    .select(
      "id, scheduled_at, status, amount, unit, medication:medications(id, name, dosage, kind, is_rescue)",
    )
    .eq("user_id", userId)
    .gte("scheduled_at", startIso)
    .lte("scheduled_at", endIso)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  const raw = ((data as unknown as TodayDoseRow[]) ?? []).filter(isScheduledDose);
  const doses = dedupeTodayDoses(raw, tz);
  return { doses, timezone: tz, label };
}
