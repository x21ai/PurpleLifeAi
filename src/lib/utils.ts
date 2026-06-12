import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * QA #18: Format a time-of-day using the device's locale (12h or 24h
 * follows the browser/OS preference). Use for all user-facing time chips.
 */
export function formatLocaleTime(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input);
  try {
    return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(d);
  } catch {
    return d.toLocaleTimeString();
  }
}

/**
 * Day index in the DEVICE'S local timezone (changes at local midnight).
 * Use for anything that rotates or buckets "per day" in the UI; the naive
 * Math.floor(now / 86_400_000) rotates at UTC midnight instead, which is
 * hours off for most of the world.
 */
export function localDayIndex(input: Date | string | number = new Date()): number {
  const d = input instanceof Date ? input : new Date(input);
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** "YYYY-MM-DD" in the device's local timezone (NOT toISOString, which is UTC). */
export function localDateKey(input: Date | string | number = new Date()): string {
  const d = input instanceof Date ? input : new Date(input);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "YYYY-MM-DD" for an instant, evaluated in an arbitrary IANA timezone. */
export function dateKeyInTimeZone(input: Date | string | number, timeZone: string): string {
  const d = input instanceof Date ? input : new Date(input);
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
