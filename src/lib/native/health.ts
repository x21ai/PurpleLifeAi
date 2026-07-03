import { isNativeApp, nativePlatform } from "./capacitor";
import {
  HEALTH_CONNECT_SOURCE,
  isHealthConnectAvailable,
  readHealthConnectMetrics,
  requestHealthConnectPermissions,
  type HealthConnectDay,
} from "./health-android";
import {
  HEALTHKIT_SOURCE,
  isHealthKitAvailable,
  readHealthKitMetrics,
  requestHealthKitPermissions,
  type HealthKitDay,
} from "./health-ios";

/**
 * Platform switch for native health reads (HealthKit on iOS, Health Connect on Android).
 *
 * Uses the runtime `window.Capacitor` bridge only. Every export is a safe no-op on
 * the web and on platforms without a native health plugin wired up yet.
 */

export type NativeHealthDay = HealthConnectDay | HealthKitDay;

export type NativeHealthAvailability = {
  available: boolean;
  reason?: string;
};

/** Biometrics source string for the active native platform, or null on web. */
export function nativeHealthSource(): "health_connect" | "apple_health" | null {
  if (!isNativeApp()) return null;
  if (nativePlatform() === "android") return HEALTH_CONNECT_SOURCE;
  if (nativePlatform() === "ios") return "apple_health";
  return null;
}

/** Check whether native health reads are available on this device. */
export async function isNativeHealthAvailable(): Promise<NativeHealthAvailability> {
  if (!isNativeApp()) return { available: false, reason: "not_native" };
  if (nativePlatform() === "android") return isHealthConnectAvailable();
  if (nativePlatform() === "ios") return isHealthKitAvailable();
  return { available: false, reason: "unsupported_platform" };
}

/** Request native health permissions for the current platform. */
export async function requestNativeHealthPermissions(): Promise<boolean> {
  if (!isNativeApp()) return false;
  if (nativePlatform() === "android") return requestHealthConnectPermissions();
  if (nativePlatform() === "ios") return requestHealthKitPermissions();
  return false;
}

/** Read native health metrics aggregated into daily rows for server upsert. */
export async function readNativeHealthMetrics(
  daysBack = 90,
): Promise<NativeHealthDay[]> {
  if (!isNativeApp()) return [];
  if (nativePlatform() === "android") return readHealthConnectMetrics(daysBack);
  if (nativePlatform() === "ios") return readHealthKitMetrics(daysBack);
  return [];
}

export { HEALTH_CONNECT_SOURCE };
