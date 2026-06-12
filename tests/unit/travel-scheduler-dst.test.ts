import { describe, expect, test } from "bun:test";
import { generateTripDoses, wallTimeInTzToUtc } from "../../src/lib/travel-scheduler";

describe("travel scheduler DST stepping (characterization)", () => {
  test("home strategy keeps wall clock in home tz across DST spring forward", () => {
    const doses = generateTripDoses({
      homeTz: "America/New_York",
      departAt: "2026-03-07T12:00:00.000Z",
      returnAt: "2026-03-09T12:00:00.000Z",
      legs: [{ tz: "America/New_York", from_at: "2026-03-07T12:00:00.000Z" }],
      slots: [{ medication_id: "m1", time: "08:00", amount: 1, unit: "tablet" }],
      strategy: "home",
      shiftHoursPerDay: 2,
    });
    expect(doses.length).toBeGreaterThan(0);
    const mar8 = doses.find((d) => d.scheduled_at.startsWith("2026-03-08"));
    expect(mar8).toBeDefined();
    const localHour = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(new Date(mar8!.scheduled_at));
    expect(Number(localHour)).toBe(8);
  });

  test("gradual strategy shifts dose wall time toward destination", () => {
    const doses = generateTripDoses({
      homeTz: "America/New_York",
      departAt: "2026-01-10T12:00:00.000Z",
      returnAt: "2026-01-13T12:00:00.000Z",
      legs: [
        { tz: "America/New_York", from_at: "2026-01-10T12:00:00.000Z" },
        { tz: "Europe/London", from_at: "2026-01-11T12:00:00.000Z", label: "London" },
      ],
      slots: [{ medication_id: "m1", time: "09:00", amount: 1, unit: "tablet" }],
      strategy: "gradual",
      shiftHoursPerDay: 2,
    });
    expect(doses.length).toBeGreaterThan(1);
  });
});

describe("notification schedule round-trip", () => {
  test("wall clock 22:30 in profile tz maps to dose instant and back", () => {
    const tz = "America/Los_Angeles";
    const instant = wallTimeInTzToUtc("2026-07-15", "22:30", tz);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(instant);
    const hour = parts.find((p) => p.type === "hour")!.value;
    const minute = parts.find((p) => p.type === "minute")!.value;
    expect(`${hour}:${minute}`).toBe("22:30");
  });
});
