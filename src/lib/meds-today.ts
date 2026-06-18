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
      fmt.formatToParts(naive).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
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

/** Start/end of today in the user's timezone, as UTC ISO bounds for DB queries. */
export function todayWindowForTimezone(tz: string): { startIso: string; endIso: string } {
  const dateFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = dateFmt.format(new Date());
  const start = tzLocalToUtc(todayStr, "00:00", tz) ?? new Date();
  const endBase = tzLocalToUtc(todayStr, "23:59", tz) ?? new Date();
  const end = new Date(endBase.getTime() + 59_999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
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
}> {
  const tz = await fetchProfileTimezone(userId);
  await supabase.rpc("regenerate_today_pending_doses", { _user_id: userId });
  const { startIso, endIso } = todayWindowForTimezone(tz);
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
  const doses = ((data as unknown as TodayDoseRow[]) ?? []).filter(isScheduledDose);
  return { doses, timezone: tz };
}
