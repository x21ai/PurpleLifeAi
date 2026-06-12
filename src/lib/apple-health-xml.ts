/**
 * Streaming parser for Apple Health export.xml.
 *
 * The export is a flat list of <Record type="..." startDate="..." endDate="..."
 * value="..."/> self-closing tags wrapped in a HealthData document. Even
 * modest exports are 50–500 MB, far past anything we can ship to a Worker,
 * so we parse client-side and only POST daily aggregates to the server.
 *
 * The parser pulls chunks from a ReadableStream, carries over partial tags,
 * regex-extracts attributes, and aggregates into per-day buckets.
 */
import type { DailyMetric } from "./apple-health.server";

type Agg = {
  date: string;
  sumSteps: number;
  sumActiveCal: number;
  sumExerciseMin: number;
  sumSleepMin: number;
  avgs: Record<string, { sum: number; n: number }>;
};

const AVG_TYPES: Record<string, keyof DailyMetric> = {
  HKQuantityTypeIdentifierHeartRate: "hr_bpm",
  HKQuantityTypeIdentifierRestingHeartRate: "resting_hr_bpm",
  HKQuantityTypeIdentifierHeartRateVariabilitySDNN: "hrv_rmssd_ms",
  HKQuantityTypeIdentifierRespiratoryRate: "respiratory_rate_bpm",
  HKQuantityTypeIdentifierOxygenSaturation: "spo2_pct",
  HKQuantityTypeIdentifierAppleSleepingWristTemperature: "skin_temp_c",
  HKQuantityTypeIdentifierVO2Max: "vo2_max",
};

const SUM_TYPES: Record<string, "sumSteps" | "sumActiveCal" | "sumExerciseMin"> = {
  HKQuantityTypeIdentifierStepCount: "sumSteps",
  HKQuantityTypeIdentifierActiveEnergyBurned: "sumActiveCal",
  HKQuantityTypeIdentifierAppleExerciseTime: "sumExerciseMin",
};

const RECORD_RE = /<Record\b([^>]*?)\/?>/g;
const ATTR_RE = /(\w+)="([^"]*)"/g;

export type ParseProgress = {
  bytesRead: number;
  totalBytes: number;
  recordsParsed: number;
  daysFound: number;
};

export async function parseHealthExport(
  file: File,
  onProgress?: (p: ParseProgress) => void,
): Promise<DailyMetric[]> {
  const stream = file.stream().pipeThrough(new TextDecoderStream());
  const reader = stream.getReader();
  const days = new Map<string, Agg>();

  let carry = "";
  let bytesRead = 0;
  let recordsParsed = 0;
  let progressTick = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytesRead += value.length;
    const text = carry + value;

    // Keep the trailing partial tag for the next chunk.
    const lastOpen = text.lastIndexOf("<Record");
    const lastClose = text.lastIndexOf(">", text.length);
    let scanEnd = text.length;
    if (lastOpen > lastClose) scanEnd = lastOpen;
    const scan = text.slice(0, scanEnd);
    carry = text.slice(scanEnd);

    RECORD_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = RECORD_RE.exec(scan)) !== null) {
      recordsParsed++;
      processAttrs(m[1], days);
    }

    if (onProgress && ++progressTick % 16 === 0) {
      onProgress({
        bytesRead,
        totalBytes: file.size,
        recordsParsed,
        daysFound: days.size,
      });
    }
  }

  // Flush carry (handles trailing record if present).
  RECORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RECORD_RE.exec(carry)) !== null) {
    recordsParsed++;
    processAttrs(m[1], days);
  }

  if (onProgress) {
    onProgress({
      bytesRead,
      totalBytes: file.size,
      recordsParsed,
      daysFound: days.size,
    });
  }

  return Array.from(days.values()).map(finalize);
}

function processAttrs(attrBlob: string, days: Map<string, Agg>) {
  let type = "",
    startDate = "",
    endDate = "",
    value = "";
  ATTR_RE.lastIndex = 0;
  let a: RegExpExecArray | null;
  while ((a = ATTR_RE.exec(attrBlob)) !== null) {
    const k = a[1],
      v = a[2];
    if (k === "type") type = v;
    else if (k === "startDate") startDate = v;
    else if (k === "endDate") endDate = v;
    else if (k === "value") value = v;
  }
  if (!type || !startDate) return;
  const day = startDate.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;

  const bucket = days.get(day) ?? createBucket(day);
  days.set(day, bucket);

  if (type === "HKCategoryTypeIdentifierSleepAnalysis") {
    // Only count actual asleep time, not "InBed".
    if (!value || !/Asleep/i.test(value)) return;
    const start = Date.parse(startDate);
    const end = Date.parse(endDate);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return;
    bucket.sumSleepMin += (end - start) / 60000;
    return;
  }

  const sumKey = SUM_TYPES[type];
  if (sumKey) {
    const n = Number(value);
    if (Number.isFinite(n)) bucket[sumKey] += n;
    return;
  }

  const avgCol = AVG_TYPES[type];
  if (avgCol) {
    let n = Number(value);
    if (!Number.isFinite(n)) return;
    // SpO2 in Apple Health is stored as a fraction (0–1); flip to percent.
    if (avgCol === "spo2_pct" && n <= 1) n = n * 100;
    const acc = bucket.avgs[avgCol] ?? { sum: 0, n: 0 };
    acc.sum += n;
    acc.n += 1;
    bucket.avgs[avgCol] = acc;
  }
}

function createBucket(date: string): Agg {
  return {
    date,
    sumSteps: 0,
    sumActiveCal: 0,
    sumExerciseMin: 0,
    sumSleepMin: 0,
    avgs: {},
  };
}

function finalize(b: Agg): DailyMetric {
  const row: DailyMetric = { date: b.date };
  if (b.sumSteps) row.steps = b.sumSteps;
  if (b.sumActiveCal) row.active_calories = b.sumActiveCal;
  if (b.sumExerciseMin) row.workout_minutes = b.sumExerciseMin;
  if (b.sumSleepMin) row.sleep_total_min = b.sumSleepMin;
  for (const [col, acc] of Object.entries(b.avgs)) {
    (row as Record<string, unknown>)[col] = acc.sum / acc.n;
  }
  return row;
}
