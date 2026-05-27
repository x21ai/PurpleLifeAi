import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { METRIC_ORDER, METRICS, type MetricKey } from "@/lib/biometric-metrics";
import { MetricCard } from "@/components/biometrics/metric-card";
import { OuraSyncStatus } from "@/components/biometrics/sync-status";

export const Route = createFileRoute("/_app/biometrics/")({
  head: () => ({
    meta: [
      { title: "Your body — Purple" },
      { name: "description", content: "All the signals Purple is reading from your body." },
    ],
  }),
  component: BiometricsIndex,
});

type BioRow = Record<string, number | string | null>;

function BiometricsIndex() {
  useRouteTheme("dark");
  const { session } = useAuth();
  const uid = session?.user.id;
  const [rows, setRows] = useState<BioRow[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const cols = [
      "recorded_at",
      ...new Set(Object.values(METRICS).map((m) => m.column)),
    ].join(", ");
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    void (async () => {
      const { data } = await supabase
        .from("biometrics")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select(cols as any)
        .eq("user_id", uid)
        .eq("source", "oura")
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });
      setRows((data as unknown as BioRow[] | null) ?? []);
    })();
  }, [uid, refreshKey]);

  const seriesByMetric = useMemo(() => {
    const out: Record<MetricKey, Array<{ date: string; value: number | null }>> = {} as never;
    for (const key of METRIC_ORDER) {
      const meta = METRICS[key];
      out[key] = (rows ?? []).map((r) => {
        const raw = r[meta.column];
        const num = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
        return {
          date: String(r.recorded_at ?? ""),
          value: Number.isFinite(num as number) ? (num as number) : null,
        };
      });
    }
    return out;
  }, [rows]);

  const empty = rows !== null && rows.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-24">
      <Link
        to="/today"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to today
      </Link>

      <p className="label-eyebrow mt-10 text-muted-foreground">Your body</p>
      <h1 className="font-serif text-[40px] sm:text-6xl leading-[1.04] tracking-[-0.02em] mt-3 text-foreground">
        Every signal Purple
        <br />
        is reading.
      </h1>

      <div className="mt-8 rounded-2xl border border-border bg-card px-5 py-4">
        <OuraSyncStatus onSynced={() => setRefreshKey((k) => k + 1)} />
      </div>

      {rows === null ? (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : empty ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-serif text-xl">No Oura data yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your ring in settings or pull data with Sync now once it&rsquo;s connected.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {METRIC_ORDER.map((m) => (
            <MetricCard key={m} metric={m} series={seriesByMetric[m]} />
          ))}
        </div>
      )}
    </div>
  );
}