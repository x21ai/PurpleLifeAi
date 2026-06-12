import { describe, expect, test } from "bun:test";

/** Mirrors medication_adherence SQL window: past doses only within lookback. */
export function adherenceWindowFilter<T extends { scheduled_at: string; status: string }>(
  doses: T[],
  now: Date,
  daysBack: number,
): T[] {
  const floor = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return doses.filter((d) => {
    const at = new Date(d.scheduled_at);
    return at >= floor && at <= now;
  });
}

export function adherencePct(doses: { status: string }[]): number {
  if (doses.length === 0) return 0;
  const taken = doses.filter((d) => d.status === "taken").length;
  return Math.round((taken * 100) / doses.length);
}

describe("adherenceWindowFilter", () => {
  const now = new Date("2026-06-12T15:00:00.000Z");

  test("excludes future doses from denominator", () => {
    const doses = [
      { scheduled_at: "2026-06-12T10:00:00.000Z", status: "taken" },
      { scheduled_at: "2026-06-12T22:00:00.000Z", status: "pending" },
    ];
    const windowed = adherenceWindowFilter(doses, now, 14);
    expect(windowed).toHaveLength(1);
    expect(adherencePct(windowed)).toBe(100);
  });

  test("excludes doses before med start (outside lookback)", () => {
    const doses = [
      { scheduled_at: "2026-05-01T10:00:00.000Z", status: "missed" },
      { scheduled_at: "2026-06-10T10:00:00.000Z", status: "taken" },
    ];
    const windowed = adherenceWindowFilter(doses, now, 14);
    expect(windowed).toHaveLength(1);
    expect(adherencePct(windowed)).toBe(100);
  });

  test("retroactive correction changes pct when status updates", () => {
    const doses = [
      { scheduled_at: "2026-06-11T10:00:00.000Z", status: "missed" },
      { scheduled_at: "2026-06-12T10:00:00.000Z", status: "taken" },
    ];
    expect(adherencePct(adherenceWindowFilter(doses, now, 14))).toBe(50);
    doses[0]!.status = "taken";
    expect(adherencePct(adherenceWindowFilter(doses, now, 14))).toBe(100);
  });
});
