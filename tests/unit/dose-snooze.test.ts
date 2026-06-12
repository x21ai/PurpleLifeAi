import { describe, expect, test } from "bun:test";

/** Snooze update shape used by today-doses and reminder-alarm-sheet. */
export function snoozeDoseUpdate(nowMs: number, snoozeMinutes = 10) {
  const snoozeUntilIso = new Date(nowMs + snoozeMinutes * 60 * 1000).toISOString();
  return {
    scheduled_at: snoozeUntilIso,
    notified_at: null as string | null,
    missed_notified_at: null as string | null,
  };
}

export function shouldFireOverdueReminder(dose: {
  scheduled_at: string;
  status: string;
  notified_at: string | null;
  missed_notified_at: string | null;
}, nowMs: number): boolean {
  if (dose.status !== "pending") return false;
  const scheduledMs = new Date(dose.scheduled_at).getTime();
  if (scheduledMs > nowMs) return false;
  return dose.notified_at === null || dose.missed_notified_at === null;
}

describe("snooze re-reminder", () => {
  test("snooze clears notified markers so a second fire is allowed", () => {
    const now = Date.parse("2026-06-12T19:00:00.000Z");
    const update = snoozeDoseUpdate(now);
    expect(update.notified_at).toBeNull();
    expect(update.missed_notified_at).toBeNull();
    expect(new Date(update.scheduled_at).getTime()).toBe(now + 10 * 60 * 1000);
  });

  test("after snooze, dose is eligible to notify again at the new scheduled time", () => {
    const now = Date.parse("2026-06-12T19:30:00.000Z");
    const snoozed = {
      scheduled_at: snoozeDoseUpdate(now).scheduled_at,
      status: "pending",
      notified_at: null,
      missed_notified_at: null,
    };
    const atSnoozeFire = Date.parse(snoozed.scheduled_at) + 1000;
    expect(shouldFireOverdueReminder(snoozed, atSnoozeFire)).toBe(true);
  });
});
