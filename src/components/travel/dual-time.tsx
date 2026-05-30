import * as React from "react";

/**
 * Render a UTC instant in two timezones — primary (local/device) and a small
 * secondary chip showing the home timezone. Used during travel so the user can
 * see "3:00 AM HKT · 10:00 PM EST home" and know which scheduled dose this is.
 */
export function DualTime({
  iso,
  homeTz,
  className,
}: {
  iso: string;
  homeTz: string | null;
  className?: string;
}) {
  const date = new Date(iso);
  const local = formatTime(date, undefined);
  const home = homeTz ? formatTime(date, homeTz) : null;
  const localZone = shortZone(undefined);
  const homeZone = homeTz ? shortZone(homeTz) : null;

  if (!home || home === local) {
    return <span className={className}>{local}</span>;
  }
  return (
    <span className={className}>
      <span>{local}</span>
      <span className="ml-1.5 text-[10px] text-muted-foreground">
        {localZone} · {home} {homeZone} home
      </span>
    </span>
  );
}

function formatTime(d: Date, tz: string | undefined): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

function shortZone(tz: string | undefined): string {
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date());
    const name = parts.find((p) => p.type === "timeZoneName")?.value;
    return name ?? "";
  } catch {
    return "";
  }
}