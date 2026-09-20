import { stagingFrom } from "./api-query";

export type TodayLiveData = {
  loaded: boolean;
  hasLiveSession: boolean;
  sleepLabel: string;
  symptomsLabel: string;
  medicationLabel: string;
  notesLabel: string;
  narrativeTitle: string;
  narrativeBody: string;
  readiness: number | null;
  sleepScore: number | null;
  hasBiometrics: boolean;
};

type BiometricRow = {
  recorded_at: string;
  sleep_score: number | null;
  oura_readiness_score: number | null;
};

type JournalRow = {
  id: string;
  created_at: string;
};

type MedDoseRow = {
  id: string;
  scheduled_at: string;
  status: string;
};

type HealthNarrativeRow = {
  narrative: string;
};

const DAY_MS = 24 * 3600 * 1000;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatSleepMinutes(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return "Not recorded";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs <= 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

export async function fetchTodayLiveData(): Promise<TodayLiveData> {
  const since = new Date(Date.now() - 60 * DAY_MS).toISOString();
  const day = todayKey();
  const dayStart = `${day}T00:00:00.000Z`;
  const dayEnd = `${day}T23:59:59.999Z`;

  const [bioRes, journalRes, dosesRes, narrativeRes] = await Promise.allSettled([
    stagingFrom("biometrics")
      .select("recorded_at, sleep_score, oura_readiness_score, sleep_total_min")
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(200)
      .list(),
    stagingFrom("journal_entries")
      .select("id, created_at")
      .gte("created_at", dayStart)
      .lte("created_at", dayEnd)
      .order("created_at", { ascending: false })
      .limit(50)
      .list(),
    stagingFrom("medication_doses")
      .select("id, scheduled_at, status")
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .limit(50)
      .list(),
    stagingFrom("health_narratives")
      .select("narrative")
      .eq("day", day)
      .maybeSingle(),
  ]).then((results) =>
    results.map((r) =>
      r.status === "fulfilled" ? r.value : { data: [] as unknown[], error: new Error("query failed") },
    ),
  );

  const bioRows = (bioRes.data ?? []) as Array<BiometricRow & { sleep_total_min?: number | null }>;
  const todayBio = bioRows.filter(
    (r) => r.recorded_at >= dayStart && r.recorded_at <= dayEnd,
  );
  const latestBio = todayBio[0] ?? bioRows[0];

  const journalRows = (journalRes.data ?? []) as JournalRow[];
  const doseRows = (dosesRes.data ?? []) as MedDoseRow[];
  const takenCount = doseRows.filter((d) => d.status === "taken").length;

  const sleepMinutes = latestBio?.sleep_total_min ?? null;
  const sleepScore = latestBio?.sleep_score ?? null;
  const readiness = latestBio?.oura_readiness_score ?? null;

  const narrativeRow = narrativeRes.data as HealthNarrativeRow | null;
  const narrative = narrativeRow?.narrative;

  const hasBiometrics = bioRows.length > 0;
  const journalCount = journalRows.length;

  let sleepLabel = "Not recorded";
  if (sleepMinutes != null && sleepMinutes > 0) {
    sleepLabel = formatSleepMinutes(sleepMinutes);
  } else if (sleepScore != null) {
    sleepLabel = `Score ${sleepScore}`;
  }

  const symptomsLabel = readiness != null ? `Readiness ${readiness}` : "No entry";
  const medicationLabel =
    takenCount > 0
      ? `${takenCount} dose${takenCount === 1 ? "" : "s"} taken`
      : doseRows.length > 0
        ? "Due today"
        : "No entry";
  const notesLabel =
    journalCount === 0
      ? "No notes"
      : `${journalCount} entr${journalCount === 1 ? "y" : "ies"}`;

  let narrativeTitle = "Today is ready when you are.";
  let narrativeBody =
    "Add sleep, symptoms, medication, or a note. PurpleLife keeps each detail private until you choose to share it.";

  if (narrative) {
    narrativeTitle = "Your health today";
    narrativeBody = narrative;
  } else if (hasBiometrics || journalCount > 0 || takenCount > 0) {
    narrativeTitle = "A few details are taking shape.";
    narrativeBody =
      "Live data from your Cloudflare account. Review source entries before acting on any pattern.";
  }

  return {
    loaded: true,
    hasLiveSession: true,
    sleepLabel,
    symptomsLabel,
    medicationLabel,
    notesLabel,
    narrativeTitle,
    narrativeBody,
    readiness,
    sleepScore,
    hasBiometrics,
  };
}

export const EMPTY_TODAY_LIVE: TodayLiveData = {
  loaded: false,
  hasLiveSession: false,
  sleepLabel: "Not recorded",
  symptomsLabel: "No entry",
  medicationLabel: "No entry",
  notesLabel: "No notes",
  narrativeTitle: "Today is ready when you are.",
  narrativeBody:
    "Add sleep, symptoms, medication, or a note. PurpleLife keeps each detail private until you choose to share it.",
  readiness: null,
  sleepScore: null,
  hasBiometrics: false,
};
