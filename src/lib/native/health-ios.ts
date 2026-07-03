import { callPlugin, isNativeApp, nativePlatform } from "./capacitor";

/**
 * iOS HealthKit bridge via the runtime `window.Capacitor.Plugins.Health`
 * bridge (no npm import in the web bundle). Uses `@capgo/capacitor-health`,
 * the same plugin as Android Health Connect. Aggregates samples into daily
 * rows for upsert through syncNativeHealthBatch.
 */

export const HEALTHKIT_SOURCE = "apple_health" as const;

const HEALTH_PLUGIN = "Health";

const READ_TYPES = [
  "sleep",
  "heartRateVariability",
  "steps",
  "heartRate",
  "restingHeartRate",
  "vo2Max",
] as const;

/** One day's HealthKit metrics, ready for server upsert. */
export type HealthKitDay = {
  date: string;
  source: typeof HEALTHKIT_SOURCE;
  hrv_rmssd_ms?: number | null;
  resting_hr_bpm?: number | null;
  hr_bpm?: number | null;
  sleep_total_min?: number | null;
  sleep_rem_min?: number | null;
  sleep_deep_min?: number | null;
  steps?: number | null;
  vo2_max?: number | null;
};

type HealthSample = {
  value?: number;
  startDate?: string;
  endDate?: string;
  sleepState?: string;
  stages?: Array<{ stage?: string; durationMinutes?: number }>;
};

type AggregatedSample = {
  startDate?: string;
  value?: number;
};

type AvailabilityResult = {
  available?: boolean;
  reason?: string;
};

type AuthorizationStatus = {
  readAuthorized?: string[];
  readDenied?: string[];
};

function isIosNative(): boolean {
  return isNativeApp() && nativePlatform() === "ios";
}

function dayKey(iso: string | undefined): string | null {
  if (!iso) return null;
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

function ensureDay(map: Map<string, HealthKitDay>, date: string): HealthKitDay {
  const existing = map.get(date);
  if (existing) return existing;
  const row: HealthKitDay = { date, source: HEALTHKIT_SOURCE };
  map.set(date, row);
  return row;
}

function bumpAvg(
  acc: { sum: number; n: number } | undefined,
  value: number,
): { sum: number; n: number } {
  const next = acc ?? { sum: 0, n: 0 };
  next.sum += value;
  next.n += 1;
  return next;
}

function isoRange(daysBack: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** True when HealthKit is available on this iOS device. */
export async function isHealthKitAvailable(): Promise<{
  available: boolean;
  reason?: string;
}> {
  if (!isIosNative()) return { available: false, reason: "not_ios" };
  const result = (await callPlugin(HEALTH_PLUGIN, "isAvailable")) as
    | AvailabilityResult
    | undefined;
  if (!result?.available) {
    return { available: false, reason: result?.reason ?? "unavailable" };
  }
  return { available: true };
}

/** Opens the HealthKit permission sheet for sleep, HRV, steps, heart rate, and VO2 max. */
export async function requestHealthKitPermissions(): Promise<boolean> {
  if (!isIosNative()) return false;
  const availability = await isHealthKitAvailable();
  if (!availability.available) return false;

  const status = (await callPlugin(HEALTH_PLUGIN, "requestAuthorization", {
    read: [...READ_TYPES],
    write: [],
  })) as AuthorizationStatus | undefined;

  const authorized = status?.readAuthorized ?? [];
  return READ_TYPES.every((type) => authorized.includes(type));
}

/** Read and aggregate HealthKit samples into daily rows. */
export async function readHealthKitMetrics(daysBack = 90): Promise<HealthKitDay[]> {
  if (!isIosNative()) return [];

  const availability = await isHealthKitAvailable();
  if (!availability.available) return [];

  const { startDate, endDate } = isoRange(daysBack);
  const byDay = new Map<string, HealthKitDay>();
  const hrBuckets = new Map<string, { sum: number; n: number }>();
  const hrvBuckets = new Map<string, { sum: number; n: number }>();
  const vo2Buckets = new Map<string, { sum: number; n: number }>();

  const stepsResult = (await callPlugin(HEALTH_PLUGIN, "queryAggregated", {
    dataType: "steps",
    startDate,
    endDate,
    bucket: "day",
    aggregation: "sum",
  })) as { samples?: AggregatedSample[] } | undefined;

  for (const sample of stepsResult?.samples ?? []) {
    const date = dayKey(sample.startDate);
    if (!date || !Number.isFinite(sample.value)) continue;
    const row = ensureDay(byDay, date);
    row.steps = Math.round(sample.value!);
  }

  const restingResult = (await callPlugin(HEALTH_PLUGIN, "queryAggregated", {
    dataType: "restingHeartRate",
    startDate,
    endDate,
    bucket: "day",
    aggregation: "average",
  })) as { samples?: AggregatedSample[] } | undefined;

  for (const sample of restingResult?.samples ?? []) {
    const date = dayKey(sample.startDate);
    if (!date || !Number.isFinite(sample.value)) continue;
    ensureDay(byDay, date).resting_hr_bpm = Math.round(sample.value!);
  }

  const heartRateResult = (await callPlugin(HEALTH_PLUGIN, "readSamples", {
    dataType: "heartRate",
    startDate,
    endDate,
    limit: 5000,
    ascending: true,
  })) as { samples?: HealthSample[] } | undefined;

  for (const sample of heartRateResult?.samples ?? []) {
    const date = dayKey(sample.endDate ?? sample.startDate);
    if (!date || !Number.isFinite(sample.value)) continue;
    hrBuckets.set(date, bumpAvg(hrBuckets.get(date), sample.value!));
  }

  const hrvResult = (await callPlugin(HEALTH_PLUGIN, "readSamples", {
    dataType: "heartRateVariability",
    startDate,
    endDate,
    limit: 5000,
    ascending: true,
  })) as { samples?: HealthSample[] } | undefined;

  for (const sample of hrvResult?.samples ?? []) {
    const date = dayKey(sample.endDate ?? sample.startDate);
    if (!date || !Number.isFinite(sample.value)) continue;
    hrvBuckets.set(date, bumpAvg(hrvBuckets.get(date), sample.value!));
  }

  const vo2Result = (await callPlugin(HEALTH_PLUGIN, "readSamples", {
    dataType: "vo2Max",
    startDate,
    endDate,
    limit: 5000,
    ascending: true,
  })) as { samples?: HealthSample[] } | undefined;

  for (const sample of vo2Result?.samples ?? []) {
    const date = dayKey(sample.endDate ?? sample.startDate);
    if (!date || !Number.isFinite(sample.value)) continue;
    vo2Buckets.set(date, bumpAvg(vo2Buckets.get(date), sample.value!));
  }

  const sleepResult = (await callPlugin(HEALTH_PLUGIN, "readSamples", {
    dataType: "sleep",
    startDate,
    endDate,
    limit: 5000,
    ascending: true,
  })) as { samples?: HealthSample[] } | undefined;

  for (const sample of sleepResult?.samples ?? []) {
    const date = dayKey(sample.endDate ?? sample.startDate);
    if (!date) continue;
    const row = ensureDay(byDay, date);

    if (Array.isArray(sample.stages) && sample.stages.length > 0) {
      let total = 0;
      let rem = 0;
      let deep = 0;
      for (const stage of sample.stages) {
        const minutes = stage.durationMinutes ?? 0;
        if (minutes <= 0) continue;
        total += minutes;
        if (stage.stage === "rem") rem += minutes;
        if (stage.stage === "deep") deep += minutes;
      }
      if (total > 0) row.sleep_total_min = (row.sleep_total_min ?? 0) + Math.round(total);
      if (rem > 0) row.sleep_rem_min = (row.sleep_rem_min ?? 0) + Math.round(rem);
      if (deep > 0) row.sleep_deep_min = (row.sleep_deep_min ?? 0) + Math.round(deep);
      continue;
    }

    if (Number.isFinite(sample.value) && sample.value! > 0) {
      row.sleep_total_min = (row.sleep_total_min ?? 0) + Math.round(sample.value!);
    }
  }

  for (const [date, acc] of hrBuckets) {
    if (acc.n === 0) continue;
    ensureDay(byDay, date).hr_bpm = Math.round(acc.sum / acc.n);
  }

  for (const [date, acc] of hrvBuckets) {
    if (acc.n === 0) continue;
    ensureDay(byDay, date).hrv_rmssd_ms = Math.round((acc.sum / acc.n) * 10) / 10;
  }

  for (const [date, acc] of vo2Buckets) {
    if (acc.n === 0) continue;
    ensureDay(byDay, date).vo2_max = Math.round((acc.sum / acc.n) * 10) / 10;
  }

  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}
