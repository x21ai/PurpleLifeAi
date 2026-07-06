import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ChevronRight, Upload, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { METRICS, type MetricKey } from "@/lib/biometric-metrics";
import { AppPage } from "@/components/layout/app-page";
import { cn } from "@/lib/utils";

const DATA_WEARABLE_KEYS: MetricKey[] = [
  "sleep_score",
  "sleep_total",
  "hrv",
  "resting_hr",
  "readiness",
  "activity_score",
];

export const Route = createFileRoute("/_app/data")({
  head: () => ({
    meta: [
      { title: "Your data · Purple" },
      { name: "description", content: "Labs and wearable signals in one place." },
    ],
  }),
  component: DataPage,
});

type BioRow = Record<string, number | string | null>;
type LabRow = {
  metric_key: string;
  display_name: string | null;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  flag: string | null;
  reference_low: number | null;
  reference_high: number | null;
  measured_at: string | null;
  created_at: string;
};

type WearableLatest = {
  metricKey: MetricKey;
  label: string;
  valueLabel: string;
  source: string;
};

type LabLatest = {
  metricKey: string;
  label: string;
  valueLabel: string;
  flag: string;
  referenceLow: number | null;
  referenceHigh: number | null;
};

function formatWearableValue(key: MetricKey, raw: number | null): string {
  if (raw == null) return "–";
  return METRICS[key].format(raw);
}

function flagBadgeClass(flag: string): string {
  const f = flag.toLowerCase();
  if (f === "high" || f === "low" || f === "abnormal") {
    return "bg-[color:var(--data-alert)]/15 text-[color:var(--data-alert)]";
  }
  if (f === "normal") {
    return "bg-[color:var(--data-good)]/15 text-[color:var(--data-good)]";
  }
  return "bg-secondary text-muted-foreground";
}

function DataPage() {
  useRouteTheme("dark");
  const { session } = useAuth();
  const uid = session?.user.id;
  const [query, setQuery] = useState("");
  const [bioRows, setBioRows] = useState<BioRow[] | null>(null);
  const [labRows, setLabRows] = useState<LabRow[] | null>(null);

  useEffect(() => {
    if (!uid) return;
    const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
    void (async () => {
      const cols = [
        "recorded_at",
        "source",
        ...new Set(DATA_WEARABLE_KEYS.map((k) => METRICS[k].column)),
      ].join(", ");
      const [{ data: bios }, { data: labs }] = await Promise.all([
        supabase
          .from("biometrics")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .select(cols as any)
          .eq("user_id", uid)
          .gte("recorded_at", since)
          .order("recorded_at", { ascending: true }),
        supabase
          .from("report_metrics")
          .select(
            "metric_key, display_name, value, value_text, unit, flag, reference_low, reference_high, measured_at, created_at",
          )
          .gte("created_at", since)
          .order("created_at", { ascending: true })
          .limit(400),
      ]);
      setBioRows((bios as BioRow[] | null) ?? []);
      setLabRows((labs as LabRow[] | null) ?? []);
    })();
  }, [uid]);

  const wearables = useMemo((): WearableLatest[] => {
    const out: WearableLatest[] = [];
    for (const key of DATA_WEARABLE_KEYS) {
      const meta = METRICS[key];
      let latest: BioRow | null = null;
      for (const row of bioRows ?? []) {
        const raw = row[meta.column];
        const num = typeof raw === "number" ? raw : raw == null ? null : Number(raw);
        if (num == null || !Number.isFinite(num)) continue;
        latest = row;
      }
      if (!latest) continue;
      const raw = latest[meta.column];
      const num = typeof raw === "number" ? raw : Number(raw);
      out.push({
        metricKey: key,
        label: meta.label,
        valueLabel: formatWearableValue(key, Number.isFinite(num) ? num : null),
        source: String(latest.source ?? "wearable"),
      });
    }
    return out;
  }, [bioRows]);

  const labs = useMemo((): LabLatest[] => {
    const byKey = new Map<string, LabRow>();
    for (const row of labRows ?? []) {
      byKey.set(row.metric_key, row);
    }
    return [...byKey.values()].map((row) => ({
      metricKey: row.metric_key,
      label: row.display_name ?? row.metric_key,
      valueLabel:
        row.value_text ??
        (row.value != null ? `${row.value}${row.unit ? ` ${row.unit}` : ""}` : "–"),
      flag: row.flag ?? "normal",
      referenceLow: row.reference_low,
      referenceHigh: row.reference_high,
    }));
  }, [labRows]);

  const hasLabs = labs.length > 0;
  const q = query.trim().toLowerCase();
  const matches = (label: string, key: string) =>
    !q || label.toLowerCase().includes(q) || key.toLowerCase().includes(q);

  const filteredWearables = wearables.filter((w) => matches(w.label, w.metricKey));
  const filteredLabs = labs.filter((l) => matches(l.label, l.metricKey));

  const flagSummary = useMemo(() => {
    let normal = 0;
    let out = 0;
    for (const lab of labs) {
      const f = lab.flag.toLowerCase();
      if (f === "high" || f === "low" || f === "abnormal") out++;
      else normal++;
    }
    const total = normal + out;
    return { normal, out, total, normalPct: total ? (normal / total) * 100 : 0, outPct: total ? (out / total) * 100 : 0 };
  }, [labs]);

  return (
    <AppPage width="lg" safeBottom="nav" className="px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-32">
      <h1 className="app-hero-title text-[22px] sm:text-2xl text-foreground">
        Your data
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        Labs from report_metrics and wearable signals from biometrics.
      </p>

      {hasLabs ? (
        <div className="mt-6 glass-surface rounded-[20px] p-4 sm:p-5">
          <p className="label-eyebrow text-[color:var(--purple-primary)]">
            Biomarkers · {flagSummary.total} total
          </p>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-secondary/60">
            <span
              className="bg-[color:var(--data-good)] transition-all"
              style={{ width: `${flagSummary.normalPct}%` }}
            />
            <span
              className="bg-[color:var(--data-alert)] transition-all"
              style={{ width: `${flagSummary.outPct}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>{flagSummary.normal} in range</span>
            <span>{flagSummary.out} out of range</span>
          </div>
        </div>
      ) : null}

      <label className="mt-5 block">
        <span className="sr-only">Search metrics</span>
        <span className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search metric or name…"
            disabled={!hasLabs && wearables.length === 0}
            className={cn(
              "w-full rounded-xl border border-border bg-background/80 py-2.5 pl-10 pr-3 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[color:var(--purple-primary)]/35",
            )}
          />
        </span>
      </label>

      {filteredWearables.length > 0 ? (
        <section className="mt-8">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="label-eyebrow">Wearables · /biometrics</p>
            <span className="text-xs text-muted-foreground">{filteredWearables.length}</span>
          </div>
          <div className="space-y-2">
            {filteredWearables.map((w) => (
              <Link
                key={w.metricKey}
                to="/biometrics/$metric"
                params={{ metric: w.metricKey }}
                className="glass-press block rounded-[16px] border border-border/50 bg-secondary/20 px-4 py-3 transition hover:border-[color:var(--purple-primary)]/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{w.label}</span>
                  <span className="label-small rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                    {w.source.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="numeric text-lg font-semibold text-foreground">{w.valueLabel}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="label-eyebrow">Labs · /reports</p>
          <span className="text-xs text-muted-foreground">{filteredLabs.length}</span>
        </div>

        {hasLabs ? (
          <div className="space-y-2">
            {filteredLabs.map((lab) => (
              <Link
                key={lab.metricKey}
                to="/reports/trends/$metricKey"
                params={{ metricKey: lab.metricKey }}
                className="glass-press block rounded-[16px] border border-border/50 bg-secondary/20 px-4 py-3 transition hover:border-[color:var(--purple-primary)]/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{lab.label}</span>
                  <span className={cn("label-small rounded-full px-2 py-0.5", flagBadgeClass(lab.flag))}>
                    {lab.flag}
                  </span>
                </div>
                <p className="mt-1 numeric text-lg font-semibold text-foreground">{lab.valueLabel}</p>
              </Link>
            ))}
            <Link
              to="/reports/new"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary/40"
            >
              <Upload className="h-4 w-4" />
              Upload past labs
            </Link>
          </div>
        ) : (
          <div className="glass-surface rounded-[20px] px-6 py-10 text-center">
            <FlaskConical className="mx-auto h-8 w-8 text-[color:var(--purple-primary)]/70" />
            <h2 className="mt-4 font-serif text-lg font-semibold text-foreground">No labs yet</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Upload past results to populate biomarker trends, or order a new panel when ready.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/reports/new"
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--purple-primary)] px-5 py-2.5 text-sm font-medium text-white"
              >
                Upload past labs
              </Link>
              <Link
                to="/plan"
                search={{ tab: "recommended" }}
                className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/40"
              >
                See recommendations
              </Link>
            </div>
          </div>
        )}
      </section>
    </AppPage>
  );
}
