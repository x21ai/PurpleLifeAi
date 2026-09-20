import { stagingFrom } from "./api-query";

export type MedicationRow = {
  id: string;
  name: string;
  dosage: string | null;
  times_of_day: string | string[] | null;
  active: number | boolean;
  is_rescue: number | boolean;
  pills_remaining: number | null;
};

export type DoseRow = {
  id: string;
  medication_id: string;
  scheduled_at: string;
  status: string;
  amount: number | null;
  unit: string | null;
};

export type MedWithDoses = {
  medication: MedicationRow;
  todayDoses: DoseRow[];
};

export type DoseHistoryItem = {
  id: string;
  dayLabel: string;
  dateKey: string;
  medName: string;
  timeLabel: string;
  status: string;
  detail: string;
};

function parseTimesOfDay(raw: string | string[] | null): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function todayWindowUtc(): { start: string; end: string; dayKey: string } {
  const dayKey = new Date().toISOString().slice(0, 10);
  return {
    dayKey,
    start: `${dayKey}T00:00:00.000Z`,
    end: `${dayKey}T23:59:59.999Z`,
  };
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDayLabel(dateKey: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (dateKey === today) return "Today";
  if (dateKey === yesterday) return "Yesterday";
  const d = new Date(`${dateKey}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function statusDetail(status: string): string {
  if (status === "taken") return "Recorded";
  if (status === "missed") return "Missed";
  if (status === "skipped") return "Skipped";
  return "Scheduled";
}

export async function fetchActiveMedications(): Promise<MedicationRow[]> {
  const { data, error } = await stagingFrom("medications")
    .select("id, name, dosage, times_of_day, active, is_rescue, pills_remaining")
    .eq("active", 1)
    .order("name", { ascending: true })
    .limit(100)
    .list();

  if (error) return [];
  return (data ?? []) as MedicationRow[];
}

export async function fetchTodayDoses(): Promise<DoseRow[]> {
  const { start, end } = todayWindowUtc();
  const { data, error } = await stagingFrom("medication_doses")
    .select("id, medication_id, scheduled_at, status, amount, unit")
    .gte("scheduled_at", start)
    .lte("scheduled_at", end)
    .order("scheduled_at", { ascending: true })
    .limit(100)
    .list();

  if (error) return [];
  return (data ?? []) as DoseRow[];
}

export async function fetchMedsWithTodayDoses(): Promise<{
  medications: MedicationRow[];
  doses: DoseRow[];
  medMap: Map<string, MedicationRow>;
}> {
  const [medications, doses] = await Promise.all([fetchActiveMedications(), fetchTodayDoses()]);
  const medMap = new Map(medications.map((m) => [m.id, m]));
  return { medications, doses, medMap };
}

export async function fetchDoseHistory(days = 30): Promise<DoseHistoryItem[]> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const { data: doseData, error: doseError } = await stagingFrom("medication_doses")
    .select("id, medication_id, scheduled_at, status, amount, unit")
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: false })
    .limit(200)
    .list();

  if (doseError) return [];

  const doses = (doseData ?? []) as DoseRow[];
  const medIds = [...new Set(doses.map((d) => d.medication_id))];
  const medMap = new Map<string, MedicationRow>();

  if (medIds.length > 0) {
    const { data: medData } = await stagingFrom("medications")
      .select("id, name, dosage, times_of_day, active, is_rescue, pills_remaining")
      .limit(100)
      .list();
    for (const m of (medData ?? []) as MedicationRow[]) {
      if (medIds.includes(m.id)) medMap.set(m.id, m);
    }
  }

  return doses.map((d) => {
    const dateKey = d.scheduled_at.slice(0, 10);
    const med = medMap.get(d.medication_id);
    return {
      id: d.id,
      dayLabel: formatDayLabel(dateKey),
      dateKey,
      medName: med?.name ?? "Medication",
      timeLabel: formatTime(d.scheduled_at),
      status: d.status,
      detail: statusDetail(d.status),
    };
  });
}

export async function markDoseTaken(doseId: string): Promise<{ ok: boolean; error: Error | null }> {
  const { error } = await stagingFrom("medication_doses")
    .eq("id", doseId)
    .update({ status: "taken" })
    .list();
  return { ok: !error, error };
}

export function formatMedSchedule(med: MedicationRow): string {
  const times = parseTimesOfDay(med.times_of_day);
  if (times.length === 0) return med.dosage?.trim() || "No schedule set";
  const joined = times.join(", ");
  return med.dosage ? `${joined} · ${med.dosage}` : joined;
}
