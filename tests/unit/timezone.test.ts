import { describe, expect, test } from "bun:test";
import { wallTimeInTzToUtc } from "../../src/lib/travel-scheduler";
import { dateKeyInTimeZone, localDayIndex } from "../../src/lib/utils";

/**
 * Devyn item 1 regression tests: a wall-clock medication time plus an IANA
 * timezone must round-trip to the right instant, including across DST.
 * (The 10:30 -> 7:30 bug was wall-clock time interpreted in the wrong zone.)
 */
describe("wallTimeInTzToUtc", () => {
  test("10:30 PM in EST (winter) is 03:30 UTC next day", () => {
    const d = wallTimeInTzToUtc("2026-01-15", "22:30", "America/New_York");
    expect(d.toISOString()).toBe("2026-01-16T03:30:00.000Z");
  });

  test("10:30 PM in EDT (summer) is 02:30 UTC next day", () => {
    const d = wallTimeInTzToUtc("2026-07-15", "22:30", "America/New_York");
    expect(d.toISOString()).toBe("2026-07-16T02:30:00.000Z");
  });

  test("10:30 AM in PST (winter) is 18:30 UTC", () => {
    const d = wallTimeInTzToUtc("2026-01-15", "10:30", "America/Los_Angeles");
    expect(d.toISOString()).toBe("2026-01-15T18:30:00.000Z");
  });

  test("10:30 AM in PDT (summer) is 17:30 UTC", () => {
    const d = wallTimeInTzToUtc("2026-07-15", "10:30", "America/Los_Angeles");
    expect(d.toISOString()).toBe("2026-07-15T17:30:00.000Z");
  });

  test("spring-forward day: 10:30 stays 10:30 wall clock (EDT offset applies)", () => {
    // US DST began 2026-03-08 at 02:00; 10:30 local is already EDT (UTC-4).
    const d = wallTimeInTzToUtc("2026-03-08", "10:30", "America/New_York");
    expect(d.toISOString()).toBe("2026-03-08T14:30:00.000Z");
  });

  test("fall-back day: 10:30 PM resolves in the post-transition offset", () => {
    // US DST ended 2026-11-01 at 02:00; 22:30 local is EST (UTC-5).
    const d = wallTimeInTzToUtc("2026-11-01", "22:30", "America/New_York");
    expect(d.toISOString()).toBe("2026-11-02T03:30:00.000Z");
  });

  test("same wall clock in EST vs PST is 3 hours apart", () => {
    const est = wallTimeInTzToUtc("2026-01-15", "10:30", "America/New_York");
    const pst = wallTimeInTzToUtc("2026-01-15", "10:30", "America/Los_Angeles");
    expect(pst.getTime() - est.getTime()).toBe(3 * 60 * 60 * 1000);
  });
});

describe("dateKeyInTimeZone", () => {
  test("an evening UTC instant is the same day in London, the prior day boundary case in LA", () => {
    const instant = new Date("2026-01-16T03:30:00.000Z");
    expect(dateKeyInTimeZone(instant, "UTC")).toBe("2026-01-16");
    // 03:30 UTC is 19:30 the previous day in Los Angeles.
    expect(dateKeyInTimeZone(instant, "America/Los_Angeles")).toBe("2026-01-15");
    // and 22:30 the previous day in New York.
    expect(dateKeyInTimeZone(instant, "America/New_York")).toBe("2026-01-15");
  });

  test("falls back safely for an invalid timezone", () => {
    const instant = new Date("2026-01-16T03:30:00.000Z");
    expect(dateKeyInTimeZone(instant, "Not/AZone")).toBe("2026-01-16");
  });
});

describe("localDayIndex", () => {
  test("increments exactly at the device-local midnight", () => {
    const beforeMidnight = new Date(2026, 0, 15, 23, 59, 0);
    const afterMidnight = new Date(2026, 0, 16, 0, 1, 0);
    expect(localDayIndex(afterMidnight)).toBe(localDayIndex(beforeMidnight) + 1);
  });
});
