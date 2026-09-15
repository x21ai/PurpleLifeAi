import { d1All, d1First, d1Run } from "../d1/client";

type MedRow = {
  id: string;
  times_of_day: string | string[] | null;
  schedule: string | unknown[] | null;
  dosage_amount: number | null;
  dosage_unit: string | null;
};

function parseJsonArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? (p as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function todayInTz(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function slotToIso(dateStr: string, time: string, tz: string): string | null {
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  try {
    const naive = new Date(`${dateStr}T${m[1].padStart(2, "0")}:${m[2]}:00Z`);
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
    return new Date(naive.getTime() - (asTz - naive.getTime())).toISOString();
  } catch {
    return null;
  }
}

export async function regenerateTodayPendingDoses(userId: string): Promise<void> {
  const profile = await d1First<{ timezone: string | null }>(
    `SELECT timezone FROM profiles WHERE id = ?`,
    userId,
  );
  const tz = profile?.timezone?.trim() || "UTC";
  const userToday = todayInTz(tz);
  const dayStart = slotToIso(userToday, "00:00", tz);
  const nextDay = new Date(`${userToday}T12:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextStr = nextDay.toISOString().slice(0, 10);
  const dayEnd = slotToIso(nextStr, "00:00", tz);
  if (!dayStart || !dayEnd) return;

  await d1Run(
    `DELETE FROM medication_doses WHERE user_id = ? AND status = 'pending'
     AND scheduled_at >= ? AND scheduled_at < ?`,
    userId,
    dayStart,
    dayEnd,
  );

  const meds = await d1All<MedRow>(
    `SELECT id, times_of_day, schedule, dosage_amount, dosage_unit FROM medications
     WHERE user_id = ? AND active = 1 AND is_rescue = 0
     AND (start_date IS NULL OR start_date <= ?)
     AND (end_date IS NULL OR end_date >= ?)`,
    userId,
    userToday,
    userToday,
  );

  for (const med of meds) {
    const schedule = parseJsonArray<{ time?: string; amount?: string; unit?: string }>(med.schedule);
    if (schedule.length > 0) {
      for (const slot of schedule) {
        const t = slot.time;
        if (!t) continue;
        const scheduled = slotToIso(userToday, t, tz);
        if (!scheduled) continue;
        await insertDoseIfMissing(userId, med.id, scheduled, slot.amount, slot.unit);
      }
      continue;
    }
    const times = parseJsonArray<string>(med.times_of_day);
    for (const t of times) {
      const scheduled = slotToIso(userToday, t, tz);
      if (!scheduled) continue;
      await insertDoseIfMissing(
        userId,
        med.id,
        scheduled,
        med.dosage_amount?.toString() ?? null,
        med.dosage_unit,
      );
    }
  }
}

async function insertDoseIfMissing(
  userId: string,
  medicationId: string,
  scheduledAt: string,
  amount: string | null | undefined,
  unit: string | null | undefined,
): Promise<void> {
  const exists = await d1First<{ id: string }>(
    `SELECT id FROM medication_doses WHERE medication_id = ? AND scheduled_at = ? LIMIT 1`,
    medicationId,
    scheduledAt,
  );
  if (exists) return;
  await d1Run(
    `INSERT INTO medication_doses (id, user_id, medication_id, scheduled_at, status, amount, unit, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, datetime('now'))`,
    crypto.randomUUID(),
    userId,
    medicationId,
    scheduledAt,
    amount ? Number(amount) : null,
    unit ?? null,
  );
}
