/**
 * Metadata for every biometric metric we surface from Oura.
 * Drives the /biometrics index, drill page, and the plain-language
 * "what this means" copy.
 */

export type MetricKey =
  | "sleep_total"
  | "sleep_score"
  | "sleep_efficiency"
  | "sleep_rem"
  | "sleep_deep"
  | "hrv"
  | "resting_hr"
  | "respiratory_rate"
  | "spo2"
  | "temp_deviation"
  | "readiness"
  | "stress"
  | "resilience"
  | "activity_score"
  | "steps";

export type MetricDirection = "higher_better" | "lower_better" | "neutral";

export type MetricMeta = {
  key: MetricKey;
  label: string;
  short: string;
  unit: string;
  column: string; // biometrics column name
  direction: MetricDirection;
  format: (v: number | null) => string;
  /** Plain-language "what this means for me" copy. */
  meaning: string;
  /** Description of what counts as out-of-range vs personal baseline. */
  baselineHint: string;
  /** Soft min/max for chart Y axis padding (% above/below baseline). */
  yPad?: number;
};

const num = (v: number | null, suffix = "") => (v == null ? "—" : `${Math.round(v)}${suffix}`);
const dec = (v: number | null, dp = 1, suffix = "") =>
  v == null ? "—" : `${v.toFixed(dp)}${suffix}`;
const hm = (v: number | null) => {
  if (v == null) return "—";
  const h = Math.floor(v / 60);
  const m = Math.round(v % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export const METRICS: Record<MetricKey, MetricMeta> = {
  sleep_total: {
    key: "sleep_total",
    label: "Total sleep",
    short: "Sleep",
    unit: "h:m",
    column: "sleep_total_min",
    direction: "higher_better",
    format: hm,
    meaning:
      "How long you actually slept last night. Sleep loss is one of the most consistent triggers for seizures and mood dips — most adults do best between 7 and 9 hours.",
    baselineHint: "Lower than your usual by 60+ minutes is worth noticing.",
  },
  sleep_score: {
    key: "sleep_score",
    label: "Sleep score",
    short: "Sleep score",
    unit: "/100",
    column: "sleep_score",
    direction: "higher_better",
    format: (v) => num(v),
    meaning:
      "Oura's overall read on your sleep quality, combining duration, efficiency, latency, and timing. Above 80 is restorative; under 65 means your body didn't fully recover.",
    baselineHint: "Below 65 for two nights in a row is the soft alarm.",
  },
  sleep_efficiency: {
    key: "sleep_efficiency",
    label: "Sleep efficiency",
    short: "Efficiency",
    unit: "%",
    column: "sleep_efficiency_pct",
    direction: "higher_better",
    format: (v) => num(v, "%"),
    meaning:
      "The share of time in bed you actually spent sleeping. Healthy sleep is usually 85% or above.",
    baselineHint: "Below 80% suggests fragmented or restless sleep.",
  },
  sleep_rem: {
    key: "sleep_rem",
    label: "REM sleep",
    short: "REM",
    unit: "min",
    column: "sleep_rem_min",
    direction: "higher_better",
    format: hm,
    meaning:
      "REM is when your brain consolidates memory and emotion. It's also the stage some people are most seizure-prone in. Most adults get 60–110 minutes per night.",
    baselineHint: "A big REM dip can show up before a tough day.",
  },
  sleep_deep: {
    key: "sleep_deep",
    label: "Deep sleep",
    short: "Deep",
    unit: "min",
    column: "sleep_deep_min",
    direction: "higher_better",
    format: hm,
    meaning:
      "Deep sleep is when your body physically restores. Most adults get 60–110 minutes; less than 40 several nights running tends to feel like brain fog.",
    baselineHint: "Less than 40 minutes is on the low side for adults.",
  },
  hrv: {
    key: "hrv",
    label: "Heart rate variability",
    short: "HRV",
    unit: "ms",
    column: "hrv_rmssd_ms",
    direction: "higher_better",
    format: (v) => num(v, " ms"),
    meaning:
      "HRV measures the small beat-to-beat variation in your heart. Higher means your nervous system is well-rested. A sharp drop is one of the earliest signals of stress, illness, or overreach.",
    baselineHint: "Sustained 15%+ below your baseline is the soft alarm.",
  },
  resting_hr: {
    key: "resting_hr",
    label: "Resting heart rate",
    short: "RHR",
    unit: "bpm",
    column: "resting_hr_bpm",
    direction: "lower_better",
    format: (v) => num(v, " bpm"),
    meaning:
      "Your overnight low. A sudden rise of 7+ bpm above your usual often shows up before you feel a cold coming on, after a hard workout, or when stress is high.",
    baselineHint: "+7 bpm above your usual baseline is worth a beat of attention.",
  },
  respiratory_rate: {
    key: "respiratory_rate",
    label: "Respiratory rate",
    short: "Resp rate",
    unit: "/min",
    column: "respiratory_rate_bpm",
    direction: "neutral",
    format: (v) => dec(v, 1, " /min"),
    meaning:
      "Breaths per minute while you sleep. Steady around your baseline is good. A jump of 1.5+ breaths/min often appears the night before you feel sick.",
    baselineHint: "Most adults sit between 12 and 20 while asleep.",
  },
  spo2: {
    key: "spo2",
    label: "Blood oxygen",
    short: "SpO₂",
    unit: "%",
    column: "spo2_pct",
    direction: "higher_better",
    format: (v) => dec(v, 1, "%"),
    meaning:
      "Average overnight blood oxygen. Healthy nights sit at 95% or higher. Lower or more variable readings can hint at breathing disruptions during sleep.",
    baselineHint: "Consistently below 94% is worth flagging to your care team.",
  },
  temp_deviation: {
    key: "temp_deviation",
    label: "Skin temperature",
    short: "Temp Δ",
    unit: "°C",
    column: "body_temp_deviation_c",
    direction: "neutral",
    format: (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(2)}°C`),
    meaning:
      "How far your overnight skin temperature drifted from your personal baseline. Bigger swings (positive or negative) often line up with illness, hormonal shifts, or poor recovery.",
    baselineHint: "More than ±0.4°C from your baseline is a notable shift.",
  },
  readiness: {
    key: "readiness",
    label: "Readiness",
    short: "Readiness",
    unit: "/100",
    column: "oura_readiness_score",
    direction: "higher_better",
    format: (v) => num(v),
    meaning:
      "Oura's read on how well-recovered you are. Above 85 means take on the day; under 65 means your body is asking you to slow down.",
    baselineHint: "Below 65 for two days in a row is a clear ask to slow down.",
  },
  stress: {
    key: "stress",
    label: "Stress",
    short: "Stress",
    unit: "",
    column: "oura_stress_score",
    direction: "lower_better",
    format: (v) => (v == null ? "—" : v.toFixed(0)),
    meaning:
      "Oura's daytime stress reading. Brief spikes are normal — the thing to watch is many high-stress hours stacking across the week.",
    baselineHint: "25%+ above your baseline for several days is the signal.",
  },
  resilience: {
    key: "resilience",
    label: "Resilience",
    short: "Resilience",
    unit: "",
    column: "oura_resilience_level",
    direction: "higher_better",
    format: (v) => (v == null ? "—" : String(v)),
    meaning:
      "How well your body is absorbing daily stress over the long term. This one moves slowly — pay attention to multi-week trends rather than day-to-day.",
    baselineHint: "Stays stable; watch the multi-week trend.",
  },
  activity_score: {
    key: "activity_score",
    label: "Activity score",
    short: "Activity",
    unit: "/100",
    column: "oura_activity_score",
    direction: "higher_better",
    format: (v) => num(v),
    meaning:
      "Your overall movement for the day. Consistency matters more than peaks — most people feel best when this stays between 70 and 90.",
    baselineHint: "Big swings either way can ripple into sleep and HRV.",
  },
  steps: {
    key: "steps",
    label: "Steps",
    short: "Steps",
    unit: "",
    column: "steps",
    direction: "neutral",
    format: (v) => (v == null ? "—" : v.toLocaleString()),
    meaning:
      "Total steps for the day. Useful as a movement baseline rather than a target — sudden drops can hint at fatigue or a brewing bad day.",
    baselineHint: "A 50%+ drop from your usual is worth noticing.",
  },
};

export const METRIC_ORDER: MetricKey[] = [
  "readiness",
  "sleep_score",
  "sleep_total",
  "hrv",
  "resting_hr",
  "temp_deviation",
  "sleep_deep",
  "sleep_rem",
  "sleep_efficiency",
  "respiratory_rate",
  "spo2",
  "stress",
  "resilience",
  "activity_score",
  "steps",
];

/** Compute mean + stddev, ignoring null/NaN. */
export function stats(nums: Array<number | null | undefined>): {
  mean: number | null;
  stddev: number | null;
  count: number;
} {
  const xs = nums.filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n),
  );
  if (xs.length === 0) return { mean: null, stddev: null, count: 0 };
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
  return { mean, stddev: Math.sqrt(variance), count: xs.length };
}

/** Classify a current value vs baseline (mean + stddev), respecting direction. */
export function classifyValue(
  meta: MetricMeta,
  value: number | null,
  baseline: { mean: number | null; stddev: number | null },
): "in_range" | "low" | "high" | "unknown" {
  if (value == null || baseline.mean == null || baseline.stddev == null) return "unknown";
  const sd = Math.max(baseline.stddev, baseline.mean * 0.05); // avoid divide-by-zero
  const z = (value - baseline.mean) / sd;
  if (Math.abs(z) <= 1) return "in_range";
  return z > 1 ? "high" : "low";
}

export function statusTone(
  meta: MetricMeta,
  status: "in_range" | "low" | "high" | "unknown",
): { label: string; cls: string } {
  if (status === "unknown") return { label: "—", cls: "bg-secondary text-muted-foreground" };
  if (status === "in_range") return { label: "In range", cls: "bg-secondary text-foreground" };
  // direction-aware tone
  const bad =
    (meta.direction === "higher_better" && status === "low") ||
    (meta.direction === "lower_better" && status === "high");
  if (bad) return { label: status === "low" ? "Low" : "High", cls: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]" };
  if (meta.direction === "neutral")
    return { label: status === "low" ? "Low" : "High", cls: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]" };
  return { label: status === "low" ? "Low" : "High", cls: "bg-secondary text-foreground" };
}