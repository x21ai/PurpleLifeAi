/** Minimal Oura /v2/usercollection/sleep session shape used for mapping tests. */
export type OuraSleepSession = {
  day?: string;
  type?: string;
  total_sleep_duration?: number | null;
  rem_sleep_duration?: number | null;
  deep_sleep_duration?: number | null;
  light_sleep_duration?: number | null;
  awake_time?: number | null;
  latency?: number | null;
  efficiency?: number | null;
  average_hrv?: number | null;
  lowest_heart_rate?: number | null;
};

export type OuraDailyReadiness = {
  day?: string;
  score?: number | null;
  temperature_deviation?: number | null;
};

export type OuraDailySleep = {
  day?: string;
  score?: number | null;
};

/**
 * Pick one sleep session per calendar day: prefer long_sleep, then longest
 * total_sleep_duration. Fixes split-night and array-order regressions.
 */
export function pickSleepSessionPerDay(sessions: OuraSleepSession[]): Map<string, OuraSleepSession> {
  const sleepDetailMap = new Map<string, OuraSleepSession>();
  for (const s of sessions) {
    if (!s.day) continue;
    const prev = sleepDetailMap.get(s.day);
    if (!prev) {
      sleepDetailMap.set(s.day, s);
      continue;
    }
    const prevLong = prev.type === "long_sleep";
    const curLong = s.type === "long_sleep";
    if (curLong !== prevLong) {
      if (curLong) sleepDetailMap.set(s.day, s);
      continue;
    }
    if ((s.total_sleep_duration ?? 0) > (prev.total_sleep_duration ?? 0)) {
      sleepDetailMap.set(s.day, s);
    }
  }
  return sleepDetailMap;
}

export type MappedOuraBiometricRow = {
  sleep_total_min: number | null;
  sleep_rem_min: number | null;
  sleep_deep_min: number | null;
  sleep_light_min: number | null;
  sleep_awake_min: number | null;
  sleep_latency_min: number | null;
  sleep_efficiency_pct: number | null;
  sleep_score: number | null;
  hrv_rmssd_ms: number | null;
  resting_hr_bpm: number | null;
  body_temp_deviation_c: number | null;
  oura_readiness_score: number | null;
};

/** Map picked session + daily aggregates into the biometrics row shape. */
export function mapOuraDayToBiometricFields(input: {
  day: string;
  sleepSession: OuraSleepSession | undefined;
  dailySleep: OuraDailySleep | undefined;
  dailyReadiness: OuraDailyReadiness | undefined;
}): MappedOuraBiometricRow {
  const sl = input.sleepSession;
  const sd = input.dailySleep;
  const rd = input.dailyReadiness;
  return {
    sleep_total_min: sl?.total_sleep_duration ? Math.round(sl.total_sleep_duration / 60) : null,
    sleep_rem_min: sl?.rem_sleep_duration ? Math.round(sl.rem_sleep_duration / 60) : null,
    sleep_deep_min: sl?.deep_sleep_duration ? Math.round(sl.deep_sleep_duration / 60) : null,
    sleep_light_min: sl?.light_sleep_duration ? Math.round(sl.light_sleep_duration / 60) : null,
    sleep_awake_min: sl?.awake_time ? Math.round(sl.awake_time / 60) : null,
    sleep_latency_min: sl?.latency ? Math.round(sl.latency / 60) : null,
    sleep_efficiency_pct: sl?.efficiency ?? null,
    sleep_score: sd?.score ?? null,
    hrv_rmssd_ms: sl?.average_hrv ?? null,
    resting_hr_bpm: sl?.lowest_heart_rate ?? null,
    body_temp_deviation_c: rd?.temperature_deviation ?? null,
    oura_readiness_score: rd?.score ?? null,
  };
}
