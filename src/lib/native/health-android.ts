import { callPlugin, isNativeApp, nativePlatform } from "./capacitor";

/**
 * Android Health Connect bridge.
 *
 * Talks to the native `@capgo/capacitor-health` plugin through the runtime
 * `window.Capacitor.Plugins.Health` bridge (no npm import in the web bundle).
 * Samples are aggregated into daily rows with source `health_connect` so they
 * can be upserted into `biometrics` through the same path as Apple Health.
 */

export const HEALTH_CONNECT_SOURCE = "health_connect" as const;

const HEALTH_PLUGIN = "Health";

const READ_TYPES = ["sleep", "heartRateVariability", "steps", "heartRate"] as const;

/** One day's worth of Health Connect metrics, ready for server upsert. */
export type HealthConnectDay = {
  date: string;
  source: typeof HEALTH_CONNECT_SOURCE;
  hrv_rmssd_ms?: number | null;
  hr_bpm?: number | null;
  sleep_total_min?: number | null;
  sleep_rem_min?: number | null;
  sleep_deep_min?: number | null;
  steps?: number | null;
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

export type HealthConnectAuthStatus = {
  authorized: boolean;
  readAuthorized: string[];
  readDenied: string[];
};

function isFullyAuthorized(status: AuthorizationStatus | undefined): boolean {
  const authorized = status?.readAuthorized ?? [];
  return READ_TYPES.every((type) => authorized.includes(type));
}

function isAndroidNative(): boolean {
  return isNativeApp() && nativePlatform() === "android";
}

function dayKey(iso: string | undefined): string | null {
  if (!iso) return null;
  const day = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

function ensureDay(
  map: Map<string, HealthConnectDay>,
  date: string,
): HealthConnectDay {
  const existing = map.get(date);
  if (existing) return existing;
  const row: HealthConnectDay = { date, source: HEALTH_CONNECT_SOURCE };
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

/** True when Health Connect is available on this Android device. */
export async function isHealthConnectAvailable(): Promise<{
  available: boolean;
  reason?: string;
}> {
  if (!isAndroidNative()) return { available: false, reason: "not_android" };
  const result = (await callPlugin(HEALTH_PLUGIN, "isAvailable")) as
    | AvailabilityResult
    | undefined;
  if (!result?.available) {
    return { available: false, reason: result?.reason ?? "unavailable" };
  }
  return { available: true };
}

/** Current Health Connect authorization without prompting. */
export async function getHealthConnectAuthorizationStatus(): Promise<HealthConnectAuthStatus> {
  if (!isAndroidNative()) {
    return { authorized: false, readAuthorized: [], readDenied: [] };
  }

  const availability = await isHealthConnectAvailable();
  if (!availability.available) {
    return { authorized: false, readAuthorized: [], readDenied: [] };
  }

  const status = (await callPlugin(HEALTH_PLUGIN, "checkAuthorization", {
    read: [...READ_TYPES],
    write: [],
  })) as AuthorizationStatus | undefined;

  const readAuthorized = status?.readAuthorized ?? [];
  const readDenied = status?.readDenied ?? [];

  return {
    authorized: isFullyAuthorized(status),
    readAuthorized,
    readDenied,
  };
}

/** Opens the Health Connect permission sheet for sleep, HRV, steps, and heart rate. */
export async function requestHealthConnectPermissions(): Promise<boolean> {
  if (!isAndroidNative()) return false;
  const availability = await isHealthConnectAvailable();
  if (!availability.available) return false;

  const status = (await callPlugin(HEALTH_PLUGIN, "requestAuthorization", {
    read: [...READ_TYPES],
    write: [],
  })) as AuthorizationStatus | undefined;

  return isFullyAuthorized(status);
}

/** Read and aggregate Health Connect samples into daily rows. */
export async function readHealthConnectMetrics(
  daysBack = 90,
): Promise<HealthConnectDay[]> {
  if (!isAndroidNative()) return [];

  const availability = await isHealthConnectAvailable();
  if (!availability.available) return [];

  const { startDate, endDate } = isoRange(daysBack);
  const byDay = new Map<string, HealthConnectDay>();
  const hrBuckets = new Map<string, { sum: number; n: number }>();
  const hrvBuckets = new Map<string, { sum: number; n: number }>();

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
    const row = ensureDay(byDay, date);
    row.hr_bpm = Math.round(acc.sum / acc.n);
  }

  for (const [date, acc] of hrvBuckets) {
    if (acc.n === 0) continue;
    const row = ensureDay(byDay, date);
    row.hrv_rmssd_ms = Math.round((acc.sum / acc.n) * 10) / 10;
  }

  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}
