import { describe, expect, test } from "bun:test";
import {
  shouldShowTravelTimezoneBanner,
  shortTimezoneLabel,
} from "../../src/lib/travel-timezone-banner";

describe("shouldShowTravelTimezoneBanner", () => {
  const base = {
    profileTimezone: "America/New_York",
    deviceTimezone: "America/Los_Angeles",
    hasActiveTrip: false,
    dismissedZone: null as string | null,
  };

  test("shows when profile and device zones differ", () => {
    expect(shouldShowTravelTimezoneBanner(base)).toBe(true);
  });

  test("hides when an active trip exists (travel mode owns the decision)", () => {
    expect(shouldShowTravelTimezoneBanner({ ...base, hasActiveTrip: true })).toBe(false);
  });

  test("hides when zones match", () => {
    expect(
      shouldShowTravelTimezoneBanner({
        ...base,
        deviceTimezone: "America/New_York",
      }),
    ).toBe(false);
  });

  test("hides when dismissed for the current device zone", () => {
    expect(
      shouldShowTravelTimezoneBanner({
        ...base,
        dismissedZone: "America/Los_Angeles",
      }),
    ).toBe(false);
  });

  test("shows again when device zone changes after dismiss", () => {
    expect(
      shouldShowTravelTimezoneBanner({
        ...base,
        deviceTimezone: "Europe/London",
        dismissedZone: "America/Los_Angeles",
      }),
    ).toBe(true);
  });

  test("hides when profile timezone is missing", () => {
    expect(shouldShowTravelTimezoneBanner({ ...base, profileTimezone: null })).toBe(false);
  });

  test("hides when device timezone is missing", () => {
    expect(shouldShowTravelTimezoneBanner({ ...base, deviceTimezone: null })).toBe(false);
  });
});

describe("shortTimezoneLabel", () => {
  test("formats IANA ids as city names", () => {
    expect(shortTimezoneLabel("America/New_York")).toBe("New York");
    expect(shortTimezoneLabel("Asia/Kolkata")).toBe("Kolkata");
  });
});
