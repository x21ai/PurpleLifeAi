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
