import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MetricNumber } from "@/components/ui-oura/metric-number";

type Row = {
  source: string;
  recorded_at: string;
  sleep_score: number | null;
  sleep_total_min: number | null;
  hrv_rmssd_ms: number | null;
  resting_hr_bpm: number | null;
  oura_readiness_score: number | null;
  steps: number | null;
};

export function TodayBiometrics() {
  const [row, setRow] = useState<Row | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { setLoaded(true); return; }
      const { data: tok } = await supabase
        .from("oura_tokens")
        .select("user_id")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      setConnected(!!tok);
      const since = new Date(Date.now() - 36 * 3600 * 1000).toISOString();
      const { data } = await supabase
        .from("biometrics")
        .select("source, recorded_at, sleep_score, sleep_total_min, hrv_rmssd_ms, resting_hr_bpm, oura_readiness_score, steps")
        .eq("source", "oura")
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRow(data as Row | null);
      setLoaded(true);
    })();
  }, []);

  if (!loaded) return null;

  if (!row) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <Activity className="h-6 w-6 mx-auto text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 font-serif text-base text-foreground">
          {connected
            ? "Today's read is still forming. Check back after your ring syncs."
            : "Connect your Oura ring to start reading your patterns."}
        </p>
        {!connected && (
          <Link
            to="/settings"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            Open Settings
          </Link>
        )}
      </div>
    );
  }

  const fmtSleep = (m: number | null) => {
    if (m == null) return "—";
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm === 0 ? `${h}h` : `${h}h ${mm}m`;
  };

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="label-eyebrow">Your body today</h2>
        <p className="text-[11px] text-muted-foreground">
          Oura · latest data {formatDistanceToNow(new Date(row.recorded_at), { addSuffix: true })}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-7">
        <MetricNumber
          size="sm"
          value={fmtSleep(row.sleep_total_min)}
          label="Sleep"
          sub={row.sleep_score ? `score ${row.sleep_score}` : undefined}
        />
        <MetricNumber
          size="sm"
          value={row.oura_readiness_score?.toString() ?? "—"}
          label="Readiness"
        />
        <MetricNumber
          size="sm"
          value={row.hrv_rmssd_ms ? Math.round(row.hrv_rmssd_ms) : "—"}
          label="HRV ms"
          sub={row.resting_hr_bpm ? `${Math.round(row.resting_hr_bpm)} bpm rest` : undefined}
        />
        <MetricNumber
          size="sm"
          value={row.steps?.toLocaleString() ?? "—"}
          label="Steps"
        />
      </div>
    </section>
  );
}