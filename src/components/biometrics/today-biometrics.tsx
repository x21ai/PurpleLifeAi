import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Moon, HeartPulse, Activity, Footprints } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { setLoaded(true); return; }
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

  if (!loaded || !row) return null;

  const fmtSleep = (m: number | null) =>
    m == null ? "—" : `${Math.floor(m / 60)}h ${m % 60}m`;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-foreground">Your body today</h2>
        <span className="text-[10px] font-medium uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-0.5">
          Oura
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric icon={Moon} label="Sleep" value={fmtSleep(row.sleep_total_min)} sub={row.sleep_score ? `score ${row.sleep_score}` : undefined} />
        <Metric icon={Activity} label="Readiness" value={row.oura_readiness_score?.toString() ?? "—"} />
        <Metric icon={HeartPulse} label="HRV" value={row.hrv_rmssd_ms ? `${Math.round(row.hrv_rmssd_ms)} ms` : "—"} sub={row.resting_hr_bpm ? `RHR ${Math.round(row.resting_hr_bpm)}` : undefined} />
        <Metric icon={Footprints} label="Steps" value={row.steps?.toLocaleString() ?? "—"} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Last sync {formatDistanceToNow(new Date(row.recorded_at), { addSuffix: true })}
      </p>
    </div>
  );
}

function Metric({
  icon: Icon, label, value, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 font-serif text-lg text-foreground leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}