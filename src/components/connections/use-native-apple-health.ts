import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { syncNativeHealthBatch } from "@/lib/native-health.functions";
import {
  getNativeHealthAuthorizationStatus,
  openNativeHealthSettings,
  readNativeHealthMetrics,
  requestNativeHealthPermissions,
} from "@/lib/native";
import { userMessage } from "@/lib/user-message";

const DAY_MS = 24 * 3600 * 1000;
const FRESH_WINDOW_MS = 3 * DAY_MS;

export type NativeAppleHealthSyncState = "receiving" | "stale" | "reachable" | "waiting";

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function useNativeAppleHealth() {
  const syncBatch = useServerFn(syncNativeHealthBatch);
  const [healthKitAuthorized, setHealthKitAuthorized] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasSyncedData, setHasSyncedData] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshAuth = useCallback(async () => {
    const status = await getNativeHealthAuthorizationStatus();
    setHealthKitAuthorized(status.authorized);
    setPermissionDenied(status.readDenied.length > 0 && !status.authorized);
    return status.authorized;
  }, []);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const uid = sess.session.user.id;

    const [{ data: bio }, { data: token }] = await Promise.all([
      supabase
        .from("biometrics")
        .select("recorded_at")
        .eq("user_id", uid)
        .eq("source", "apple_health")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("apple_health_tokens")
        .select("last_sync_at")
        .eq("user_id", uid)
        .maybeSingle(),
    ]);
    setLastData(bio?.recorded_at ?? null);
    setLastSyncAt(token?.last_sync_at ?? null);
    setHasSyncedData(!!bio?.recorded_at);

    await refreshAuth();
    setLoaded(true);
  }, [refreshAuth]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const syncState: NativeAppleHealthSyncState = (() => {
    if (!healthKitAuthorized) return "waiting";
    const freshnessIso = lastSyncAt ?? lastData;
    const dataAge = freshnessIso ? Date.now() - new Date(freshnessIso).getTime() : Infinity;
    if (dataAge < FRESH_WINDOW_MS) return "receiving";
    if (lastSyncAt || lastData) return "stale";
    return "reachable";
  })();

  const statusText: Record<NativeAppleHealthSyncState, string> = {
    receiving: lastSyncAt
      ? `Last synced ${relativeTime(lastSyncAt)}`
      : `Syncing · latest vitals ${relativeTime(lastData)}`,
    stale: lastSyncAt
      ? `Last synced ${relativeTime(lastSyncAt)} · open Purple to refresh from HealthKit`
      : `Last vitals ${relativeTime(lastData)} · open Purple to refresh from HealthKit`,
    reachable: "Connected · waiting for the first HealthKit sync",
    waiting: hasSyncedData
      ? `Account has older Apple Health data · connect HealthKit on this iPhone`
      : "Not connected · grant HealthKit access to sync vitals",
  };

  const runNativeSync = async () => {
    const granted = await refreshAuth();
    if (!granted) return false;

    const days = await readNativeHealthMetrics(90);
    if (days.length === 0) {
      toast.info("No HealthKit samples yet. Wear your watch or phone and try again later.");
      return true;
    }

    const samples = days.map(({ source: _source, ...rest }) => rest);
    await syncBatch({ data: { source: "apple_health", samples } });
    setLastSyncAt(new Date().toISOString());
    return true;
  };

  const connect = async () => {
    setBusy(true);
    setPermissionDenied(false);
    try {
      const alreadyAuthorized = await refreshAuth();
      if (!alreadyAuthorized) {
        const granted = await requestNativeHealthPermissions();
        if (!granted) {
          setHealthKitAuthorized(false);
          setPermissionDenied(true);
          return;
        }
        setHealthKitAuthorized(true);
        setPermissionDenied(false);
      }

      const ok = await runNativeSync();
      if (ok) {
        toast.success("Apple Health connected. Vitals synced from HealthKit.");
      }
    } catch (e) {
      toast.error(userMessage(e, "Couldn't sync Apple Health"));
    } finally {
      setBusy(false);
      void refresh();
    }
  };

  const syncNow = async () => {
    setBusy(true);
    try {
      const granted = await refreshAuth();
      if (!granted) {
        setPermissionDenied(true);
        return;
      }
      const ok = await runNativeSync();
      if (ok) toast.success("HealthKit sync complete.");
    } catch (e) {
      toast.error(userMessage(e, "Couldn't sync Apple Health"));
    } finally {
      setBusy(false);
      void refresh();
    }
  };

  const openSettings = async () => {
    const opened = await openNativeHealthSettings();
    if (!opened) {
      toast.error("Couldn't open Settings. Open Settings, then Health, and allow Purple.");
    }
  };

  return {
    /** Native HealthKit permission on this device (never inferred from DB rows). */
    healthKitAuthorized,
    /** @deprecated Use healthKitAuthorized. Kept for callers not yet updated. */
    linked: healthKitAuthorized,
    permissionDenied,
    hasSyncedData,
    loaded,
    lastData,
    lastSyncAt,
    busy,
    syncState,
    statusText,
    connect,
    syncNow,
    openSettings,
    relativeTime,
  };
}
