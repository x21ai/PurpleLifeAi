import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { syncNativeHealthBatch } from "@/lib/native-health.functions";
import {
  getNativeHealthAuthorizationStatus,
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
  const [hasSyncedData, setHasSyncedData] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshAuth = useCallback(async () => {
    const status = await getNativeHealthAuthorizationStatus();
    setHealthKitAuthorized(status.authorized);
    return status.authorized;
  }, []);

  const refresh = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    const uid = sess.session.user.id;

    const { data: bio } = await supabase
      .from("biometrics")
      .select("recorded_at")
      .eq("user_id", uid)
      .eq("source", "apple_health")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastData(bio?.recorded_at ?? null);
    setHasSyncedData(!!bio?.recorded_at);

    await refreshAuth();
    setLoaded(true);
  }, [refreshAuth]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const syncState: NativeAppleHealthSyncState = (() => {
    if (!healthKitAuthorized) return "waiting";
    const dataAge = lastData ? Date.now() - new Date(lastData).getTime() : Infinity;
    if (dataAge < FRESH_WINDOW_MS) return "receiving";
    if (lastData) return "stale";
    return "reachable";
  })();

  const statusText: Record<NativeAppleHealthSyncState, string> = {
    receiving: `Syncing · latest data ${relativeTime(lastData)}`,
    stale: `Last data ${relativeTime(lastData)} · open Purple to refresh from HealthKit`,
    reachable: "Connected · waiting for the first HealthKit sync",
    waiting: hasSyncedData
      ? `Account has older Apple Health data · tap Connect to link HealthKit on this iPhone`
      : "Not connected · grant HealthKit access to sync vitals",
  };

  const ensurePermissions = async (): Promise<boolean> => {
    const alreadyAuthorized = await refreshAuth();
    if (alreadyAuthorized) return true;

    const granted = await requestNativeHealthPermissions();
    if (granted) {
      setHealthKitAuthorized(true);
      return true;
    }

    setHealthKitAuthorized(false);
    toast.error("HealthKit permission was not granted. Open Settings to allow access.");
    return false;
  };

  const runNativeSync = async () => {
    const granted = await ensurePermissions();
    if (!granted) return false;

    const days = await readNativeHealthMetrics(90);
    if (days.length === 0) {
      toast.info("No HealthKit samples yet. Wear your watch or phone and try again later.");
      return true;
    }

    const samples = days.map(({ source: _source, ...rest }) => rest);
    await syncBatch({ data: { source: "apple_health", samples } });
    return true;
  };

  const connect = async () => {
    setBusy(true);
    try {
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
      const ok = await runNativeSync();
      if (ok) toast.success("HealthKit sync complete.");
    } catch (e) {
      toast.error(userMessage(e, "Couldn't sync Apple Health"));
    } finally {
      setBusy(false);
      void refresh();
    }
  };

  return {
    /** Native HealthKit permission on this device (never inferred from DB rows). */
    healthKitAuthorized,
    /** @deprecated Use healthKitAuthorized. Kept for callers not yet updated. */
    linked: healthKitAuthorized,
    hasSyncedData,
    loaded,
    lastData,
    busy,
    syncState,
    statusText,
    connect,
    syncNow,
    relativeTime,
  };
}
