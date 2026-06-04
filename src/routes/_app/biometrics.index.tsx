import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { METRIC_ORDER, METRICS, type MetricKey } from "@/lib/biometric-metrics";
import { MetricCard } from "@/components/biometrics/metric-card";
import { OuraSyncStatus } from "@/components/biometrics/sync-status";
import { useTranslation } from "react-i18next";

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
type SourceKey = "oura" | "whoop" | "apple_health" | "manual";
const SOURCES: SourceKey[] = ["oura", "whoop", "apple_health", "manual"];

function BiometricsIndex() {
  useRouteTheme("dark");
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user.id;
  const [rows, setRows] = useState<BioRow[] | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const cols = [
      "recorded_at",
      "source",
      ...new Set(Object.values(METRICS).map((m) => m.column)),
    ].join(", ");
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    void (async () => {
      const { data } = await supabase
        .from("biometrics")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .select(cols as any)
        .eq("user_id", uid)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true });
      setRows((data as unknown as BioRow[] | null) ?? []);
    })();
  }, [uid, refreshKey]);

  const seriesByMetric = useMemo(() => {
    const out: Record<MetricKey, Partial<Record<SourceKey, Array<{ date: string; value: number | null }>>>> = {} as never;
    for (const key of METRIC_ORDER) {
      const meta = METRICS[key];
      const bySrc: Partial<Record<SourceKey, Array<{ date: string; value: number | null }>>> = {};
      for (const src of SOURCES) bySrc[src] = [];
      for (const r of rows ?? []) {
        const src = (String(r.source ?? "") as SourceKey);
        if (!SOURCES.includes(src)) continue;
        const raw = r[meta.column];
        const num = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
        bySrc[src]!.push({
          date: String(r.recorded_at ?? ""),
          value: Number.isFinite(num as number) ? (num as number) : null,
        });
      }
      // Drop sources with no real readings.
      for (const src of SOURCES) {
        if (!bySrc[src]!.some((d) => d.value != null)) delete bySrc[src];
      }
      out[key] = bySrc;
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
        {t("biometrics.backToToday")}
      </Link>

      <p className="label-eyebrow mt-10 text-muted-foreground">{t("biometrics.eyebrow")}</p>
      <h1 className="font-serif text-[40px] sm:text-6xl leading-[1.04] tracking-[-0.02em] mt-3 text-foreground">
        {t("biometrics.title1")}
        <br />
        {t("biometrics.title2")}
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
          <p className="font-serif text-xl">{t("biometrics.noDataTitle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("biometrics.noDataBody")}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {METRIC_ORDER.map((m) => (
            <MetricCard key={m} metric={m} seriesBySource={seriesByMetric[m]} />
          ))}
        </div>
      )}

      <SourceLegend />
      <SourceFieldMatrix />
    </div>
  );
}

function SourceLegend() {
  const items = [
    { label: "Oura",         color: "var(--purple-primary)" },
    { label: "Whoop",        color: "#34D399" },
    { label: "Apple Health", color: "#F472B6" },
    { label: "Manual",       color: "#A1A1AA" },
  ];
  return (
    <div className="mt-10 flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
      <span className="label-eyebrow">Sources</span>
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function SourceFieldMatrix() {
  // Rough capability matrix. Daily-summary granularity, varies by ring/watch.
  const rows: Array<{ label: string; oura: boolean; whoop: boolean; apple: boolean }> = [
    { label: "Total sleep",        oura: true,  whoop: true,  apple: true  },
    { label: "Sleep score",        oura: true,  whoop: true,  apple: false },
    { label: "REM / Deep sleep",   oura: true,  whoop: true,  apple: true  },
    { label: "HRV (RMSSD)",        oura: true,  whoop: true,  apple: true  },
    { label: "Resting HR",         oura: true,  whoop: true,  apple: true  },
    { label: "Respiratory rate",   oura: true,  whoop: true,  apple: true  },
    { label: "SpO₂",               oura: true,  whoop: false, apple: true  },
    { label: "Skin temperature",   oura: true,  whoop: false, apple: true  },
    { label: "Readiness / Recovery", oura: true, whoop: true, apple: false },
    { label: "Stress / Strain",    oura: true,  whoop: true,  apple: false },
    { label: "Steps",              oura: true,  whoop: false, apple: true  },
    { label: "Active calories",    oura: true,  whoop: true,  apple: true  },
    { label: "VO₂max",             oura: false, whoop: false, apple: true  },
    { label: "Workout minutes",    oura: true,  whoop: true,  apple: true  },
  ];
  const cell = (yes: boolean) => (
    <td className="px-3 py-1.5 text-center text-foreground/70">{yes ? "✓" : "—"}</td>
  );
  return (
    <details className="mt-6 rounded-2xl border border-border bg-card p-5">
      <summary className="cursor-pointer text-sm text-foreground">
        What does each source provide?
      </summary>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="px-3 py-2 font-normal">Signal</th>
              <th className="px-3 py-2 font-normal text-center">Oura</th>
              <th className="px-3 py-2 font-normal text-center">Whoop</th>
              <th className="px-3 py-2 font-normal text-center">Apple Health</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-border/60">
                <td className="px-3 py-1.5 text-foreground">{r.label}</td>
                {cell(r.oura)}
                {cell(r.whoop)}
                {cell(r.apple)}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-muted-foreground">
          When multiple sources report the same signal, the card shows one colored line per source so you can compare them side by side.
        </p>
      </div>
    </details>
  );
}