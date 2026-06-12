/** localStorage key: dismissed device timezone id (per zone, per device). */
export const TRAVEL_TZ_DISMISS_KEY = "purple-travel-tz-banner-dismissed";

/** "America/New_York" → "New York"; falls back to last IANA segment. */
export function shortTimezoneLabel(tz: string): string {
  const last = tz.split("/").pop() ?? tz;
  return last.replace(/_/g, " ");
}

export type TravelTimezoneBannerInput = {
  profileTimezone: string | null | undefined;
  deviceTimezone: string | null | undefined;
  hasActiveTrip: boolean;
  dismissedZone: string | null | undefined;
};

/**
 * Whether Today should show the quiet travel-timezone nudge.
 * Suppressed while travel mode owns scheduling, when zones match, or when
 * the user dismissed for this device zone.
 */
export function shouldShowTravelTimezoneBanner(input: TravelTimezoneBannerInput): boolean {
  if (input.hasActiveTrip) return false;
  if (!input.deviceTimezone || !input.profileTimezone) return false;
  if (input.profileTimezone === input.deviceTimezone) return false;
  if (input.dismissedZone === input.deviceTimezone) return false;
  return true;
}

export function readDismissedTravelZone(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TRAVEL_TZ_DISMISS_KEY);
  } catch {
    return null;
  }
}

export function persistDismissedTravelZone(zone: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRAVEL_TZ_DISMISS_KEY, zone);
  } catch {
    /* quota / private mode */
  }
}
