import { describe, expect, test } from "bun:test";
import {
  mapOuraDayToBiometricFields,
  pickSleepSessionPerDay,
  type OuraSleepSession,
} from "../../supabase/functions/_shared/oura-sleep-mapping";

/** Captured shape: two sessions on one night (split sleep) plus a nap. */
const multiSessionNight: OuraSleepSession[] = [
  {
    day: "2026-01-15",
    type: "sleep",
    total_sleep_duration: 7200,
    efficiency: 72,
  },
  {
    day: "2026-01-15",
    type: "long_sleep",
    total_sleep_duration: 33120,
    rem_sleep_duration: 5400,
    deep_sleep_duration: 7200,
    light_sleep_duration: 18000,
    awake_time: 2520,
    latency: 900,
    efficiency: 89,
    average_hrv: 42,
    lowest_heart_rate: 52,
  },
  {
    day: "2026-01-15",
    type: "long_sleep",
    total_sleep_duration: 28800,
    efficiency: 81,
  },
];

describe("pickSleepSessionPerDay", () => {
  test("prefers long_sleep over other types", () => {
    const map = pickSleepSessionPerDay(multiSessionNight);
    expect(map.get("2026-01-15")?.type).toBe("long_sleep");
  });

  test("among long_sleep sessions keeps the longest total_sleep_duration", () => {
    const map = pickSleepSessionPerDay(multiSessionNight);
    expect(map.get("2026-01-15")?.total_sleep_duration).toBe(33120);
  });

  test("maps efficiency from session not daily contributor score", () => {
    const map = pickSleepSessionPerDay(multiSessionNight);
    const fields = mapOuraDayToBiometricFields({
      day: "2026-01-15",
      sleepSession: map.get("2026-01-15"),
      dailySleep: { day: "2026-01-15", score: 78 },
      dailyReadiness: { day: "2026-01-15", score: 82, temperature_deviation: 0.12 },
    });
    expect(fields.sleep_efficiency_pct).toBe(89);
    expect(fields.sleep_total_min).toBe(552);
    expect(fields.body_temp_deviation_c).toBe(0.12);
    expect(fields.oura_readiness_score).toBe(82);
  });

  test("timezone boundary: sessions on adjacent days stay separate", () => {
    const sessions: OuraSleepSession[] = [
      { day: "2026-01-14", type: "long_sleep", total_sleep_duration: 30000, efficiency: 85 },
      { day: "2026-01-15", type: "long_sleep", total_sleep_duration: 32000, efficiency: 88 },
    ];
    const map = pickSleepSessionPerDay(sessions);
    expect(map.size).toBe(2);
    expect(map.get("2026-01-14")?.total_sleep_duration).toBe(30000);
    expect(map.get("2026-01-15")?.total_sleep_duration).toBe(32000);
  });
});
