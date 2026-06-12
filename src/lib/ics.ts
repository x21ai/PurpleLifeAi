// Minimal RFC 5545 .ics builder for medication schedules and trips.
// Anchors to the user's home timezone so doses stay aligned during travel.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatUTC(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export type IcsEvent = {
  uid: string;
  title: string;
  description?: string;
  /** Start datetime in UTC. */
  start: Date;
  /** Duration minutes, defaults to 15. */
  durationMinutes?: number;
  /** RRULE string, e.g. "FREQ=DAILY;COUNT=30". */
  rrule?: string;
  /** Reminder offset in minutes before start (default 0 = at start). */
  alarmMinutesBefore?: number;
};

export function buildIcs(calName: string, events: IcsEvent[]): string {
  const now = formatUTC(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Purple Life//Medication Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calName)}`,
  ];
  for (const evt of events) {
    const dur = evt.durationMinutes ?? 15;
    const end = new Date(evt.start.getTime() + dur * 60_000);
    const alarmOffset = evt.alarmMinutesBefore ?? 0;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${evt.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatUTC(evt.start)}`,
      `DTEND:${formatUTC(end)}`,
      `SUMMARY:${escapeText(evt.title)}`,
    );
    if (evt.description) lines.push(`DESCRIPTION:${escapeText(evt.description)}`);
    if (evt.rrule) lines.push(`RRULE:${evt.rrule}`);
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeText(evt.title)}`,
      `TRIGGER:-PT${alarmOffset}M`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Trigger a download of the .ics in the browser. */
export function downloadIcs(filename: string, contents: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Build .ics events for a medication schedule, anchored to the user's home tz.
 * `homeTz` is informational only, the times are converted to absolute UTC
 * instants when the schedule is generated, then exported as UTC datetimes,
 * which calendar apps then render in the device's local time.
 */
export function medicationToIcsEvents(opts: {
  medId: string;
  medName: string;
  dosage: string | null;
  /** "HH:MM" strings in the user's home timezone. */
  timesOfDay: string[];
  /** Number of days to schedule out. Defaults to 30. */
  days?: number;
  /** ISO date YYYY-MM-DD to start from in home tz. Defaults to today. */
  startDate?: string;
  /** IANA timezone for the user's home, e.g. "America/New_York". */
  homeTz: string;
  alarmMinutesBefore?: number;
}): IcsEvent[] {
  const days = opts.days ?? 30;
  const events: IcsEvent[] = [];
  const startStr = opts.startDate ?? new Date().toISOString().slice(0, 10);
  for (let d = 0; d < days; d++) {
    const day = new Date(startStr + "T00:00:00Z");
    day.setUTCDate(day.getUTCDate() + d);
    const dateStr = day.toISOString().slice(0, 10);
    for (const t of opts.timesOfDay) {
      if (!/^\d{1,2}:\d{2}$/.test(t)) continue;
      // Build a local-time string in the home tz, then convert to absolute UTC.
      // We use the standard trick: format the local instant via Intl and adjust.
      const local = tzDateToUtc(dateStr, t, opts.homeTz);
      if (!local) continue;
      events.push({
        uid: `${opts.medId}-${dateStr}-${t.replace(":", "")}@purplelife`,
        title: opts.medName + (opts.dosage ? ` · ${opts.dosage}` : ""),
        description: `Scheduled dose of ${opts.medName}${opts.dosage ? ` (${opts.dosage})` : ""}. Anchored to home time (${opts.homeTz}).`,
        start: local,
        durationMinutes: 15,
        alarmMinutesBefore: opts.alarmMinutesBefore ?? 0,
      });
    }
  }
  return events;
}

/**
 * Convert a (date, HH:MM) interpreted in `tz` into an absolute UTC Date.
 * Browser-only; uses Intl to compute the tz offset for that local instant.
 */
function tzDateToUtc(dateStr: string, time: string, tz: string): Date | null {
  try {
    const [h, m] = time.split(":").map((n) => parseInt(n, 10));
    // Start with the naive UTC instant.
    const naive = new Date(`${dateStr}T${pad(h)}:${pad(m)}:00Z`);
    // What does that instant look like in tz?
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const parts = Object.fromEntries(
      fmt
        .formatToParts(naive)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, p.value]),
    ) as Record<string, string>;
    const asTz = Date.UTC(
      parseInt(parts.year, 10),
      parseInt(parts.month, 10) - 1,
      parseInt(parts.day, 10),
      parseInt(parts.hour === "24" ? "0" : parts.hour, 10),
      parseInt(parts.minute, 10),
      parseInt(parts.second, 10),
    );
    const offset = asTz - naive.getTime();
    return new Date(naive.getTime() - offset);
  } catch {
    return null;
  }
}
