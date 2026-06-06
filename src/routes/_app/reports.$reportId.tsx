import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Loader2, Trash2, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouteTheme } from "@/lib/use-route-theme";
import { getReport, deleteReport, getMetricTrend } from "@/lib/reports.functions";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports/$reportId")({
  head: () => ({ meta: [{ title: "Report · Purple" }] }),
  component: ReportDetailPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm text-destructive">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Report not found.</div>,
});

type Metric = {
  id: string;
  metric_key: string;
  display_name: string | null;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  reference_low: number | null;
  reference_high: number | null;
  flag: string | null;
  panel?: string | null;
};

const PANEL_LABELS: Record<string, string> = {
  lipids: "Lipids",
  cardiometabolic: "Cardiometabolic",
  thyroid: "Thyroid",
  liver: "Liver",
  kidney: "Kidney",
  hematology: "Blood count & iron",
  vitamins: "Vitamins",
  hormones: "Hormones",
  inflammation: "Inflammation",
  imaging: "Imaging",
  other: "Other",
};

function ReportDetailPage() {
  useRouteTheme("light");
  const { reportId } = Route.useParams();
  const navigate = useNavigate();
  const fetchReport = useServerFn(getReport);
  const removeReport = useServerFn(deleteReport);
  const [selectedMetric, setSelectedMetric] = React.useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => fetchReport({ data: { id: reportId } }),
    refetchInterval: (q) => {
      const status = (q.state.data as { report?: { status?: string } } | undefined)?.report?.status;
      return status === "processing" ? 3000 : false;
    },
  });

  const handleDelete = async () => {
    if (!confirm("Delete this report and its extracted values?")) return;
    try {
      await removeReport({ data: { id: reportId } });
      toast.success("Report deleted");
      navigate({ to: "/reports" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const report = data?.report;
  const metrics = (data?.metrics ?? []) as Metric[];
  const signedUrl = data?.signedUrl;

  if (!report) {
    return <div className="p-8">Report not found.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 pb-24">
      <Link
        to="/reports"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground gap-1"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Reports
      </Link>
      <div className="mt-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground truncate">
            {report.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.report_date ?? new Date(report.created_at).toLocaleDateString()}
            {report.report_type ? ` · ${report.report_type.replace(/_/g, " ")}` : ""}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {signedUrl && (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href={signedUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" /> View file
              </a>
            </Button>
          )}
          <Button onClick={handleDelete} variant="ghost" size="sm" className="rounded-full text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <MedicalDisclaimer className="mt-5" />

      {report.summary && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Summary</h2>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{report.summary}</p>
        </section>
      )}

      {(report.findings || report.impressions) && (
        <section className="mt-4 grid sm:grid-cols-2 gap-4">
          {report.findings && Array.isArray(report.findings) && (report.findings as string[]).length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Findings</h3>
              <ul className="text-sm text-foreground space-y-1.5 list-disc pl-4">
                {(report.findings as string[]).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
          {report.impressions && Array.isArray(report.impressions) && (report.impressions as string[]).length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Impressions</h3>
              <ul className="text-sm text-foreground space-y-1.5 list-disc pl-4">
                {(report.impressions as string[]).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {report.status === "processing" && (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Extracting values… this can take up to a minute.
        </div>
      )}
      {report.status === "failed" && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="text-destructive">Extraction failed: {report.error_message ?? "Unknown error"}</p>
          <Button onClick={() => void refetch()} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </div>
      )}

      {metrics.length > 0 && (
        <PanelGroups
          metrics={metrics}
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
        />
      )}

      {report.status === "ready" && metrics.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          No structured values extracted. You can still view the original file above.
        </p>
      )}
    </div>
  );
}

function MetricTrend({ metricKey, unit }: { metricKey: string; unit: string | null }) {
  const fetchTrend = useServerFn(getMetricTrend);
  const { data, isLoading } = useQuery({
    queryKey: ["metric-trend", metricKey],
    queryFn: () => fetchTrend({ data: { metricKey } }),
  });

  if (isLoading) {
    return (
      <div className="px-4 py-6 bg-accent/10">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const points = (data?.points ?? [])
    .filter((p) => p.value != null && p.measured_at)
    .map((p) => ({
      date: new Date(p.measured_at as string).toLocaleDateString(),
      value: p.value as number,
    }));
  const dict = data?.dictionary;
  const refLow = points.length > 0 ? (data?.points[0]?.reference_low ?? dict?.default_ref_low ?? null) : null;
  const refHigh = points.length > 0 ? (data?.points[0]?.reference_high ?? dict?.default_ref_high ?? null) : null;

  if (points.length < 2) {
    return (
      <div className="px-4 py-4 bg-accent/10 text-xs text-muted-foreground">
        Upload another report with this metric to see a trend over time.
        {dict?.hints && (
          <p className="mt-2 text-foreground/80">{dict.hints}</p>
        )}
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const yMin = Math.min(...values, refLow ?? Infinity);
  const yMax = Math.max(...values, refHigh ?? -Infinity);

  return (
    <div className="px-4 py-4 bg-accent/10">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <XAxis dataKey="date" fontSize={10} stroke="currentColor" opacity={0.5} />
            <YAxis domain={[yMin * 0.9, yMax * 1.1]} fontSize={10} stroke="currentColor" opacity={0.5} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v} ${unit ?? ""}`, "Value"]}
            />
            {refLow != null && refHigh != null && (
              <ReferenceArea y1={refLow} y2={refHigh} fill="hsl(var(--primary))" fillOpacity={0.08} />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {dict?.hints && (
        <p className="mt-3 text-xs text-foreground/80 leading-relaxed">{dict.hints}</p>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Shaded band = typical reference range. Always discuss results with your medical practitioner.
      </p>
    </div>
  );
}

function PanelGroups({
  metrics,
  selectedMetric,
  setSelectedMetric,
}: {
  metrics: Metric[];
  selectedMetric: string | null;
  setSelectedMetric: (k: string | null) => void;
}) {
  const grouped = React.useMemo(() => {
    const out: Record<string, Metric[]> = {};
    for (const m of metrics) {
      const key = m.panel || "other";
      (out[key] ??= []).push(m);
    }
    return out;
  }, [metrics]);

  const order = ["lipids", "cardiometabolic", "thyroid", "liver", "kidney", "hematology", "vitamins", "hormones", "inflammation", "imaging", "other"];
  const entries = Object.entries(grouped).sort(
    ([a], [b]) => order.indexOf(a) - order.indexOf(b),
  );

  return (
    <div className="mt-6 space-y-6">
      {entries.map(([panel, rows]) => (
        <section key={panel}>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {PANEL_LABELS[panel] ?? panel} · {rows.length}
          </h2>
          <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {rows.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedMetric(m.metric_key === selectedMetric ? null : m.metric_key)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/40 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{m.display_name ?? m.metric_key}</p>
                    {(m.reference_low != null || m.reference_high != null) && (
                      <p className="text-xs text-muted-foreground">
                        ref {m.reference_low ?? "–"}–{m.reference_high ?? "–"} {m.unit ?? ""}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-sm font-medium ${
                        m.flag === "high"
                          ? "text-destructive"
                          : m.flag === "low"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-foreground"
                      }`}
                    >
                      {m.value ?? m.value_text ?? "–"}
                      {m.unit ? <span className="text-xs text-muted-foreground ml-1">{m.unit}</span> : null}
                    </span>
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </button>
                {selectedMetric === m.metric_key && (
                  <MetricTrend metricKey={m.metric_key} unit={m.unit} />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}