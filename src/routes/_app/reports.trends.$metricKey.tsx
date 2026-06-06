import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { getMetricSeries } from "@/lib/report-trends.functions";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { useRouteTheme } from "@/lib/use-route-theme";

export const Route = createFileRoute("/_app/reports/trends/$metricKey")({
  head: ({ params }) => ({
    meta: [{ title: `Trend · ${params.metricKey} · Purple` }],
  }),
  component: TrendDetailPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm text-destructive">Couldn't load trend: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

type Row = {
  id: string;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  flag: string | null;
  reference_low: number | null;
  reference_high: number | null;
  measured_at: string | null;
  created_at: string;
  display_name: string | null;
  report_id: string;
  report_documents?: { title: string | null; report_date: string | null } | null;
};

const RANGES: Array<{ label: string; days: number | undefined }> = [
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
  { label: "5y", days: 365 * 5 },
  { label: "All", days: undefined },
];

function downloadCsv(filename: string, rows: Row[]) {
  const header = ["date", "value", "value_text", "unit", "flag", "report"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const date = (r.measured_at ?? r.created_at).slice(0, 10);
    const cells = [
      date,
      r.value ?? "",
      JSON.stringify(r.value_text ?? ""),
      r.unit ?? "",
      r.flag ?? "",
      JSON.stringify(r.report_documents?.title ?? ""),
    ];
    lines.push(cells.join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TrendDetailPage() {
  useRouteTheme("light");
  const { metricKey } = Route.useParams();
  const fetchSeries = useServerFn(getMetricSeries);
  const [rangeIdx, setRangeIdx] = React.useState(2);
  const days = RANGES[rangeIdx].days;

  const { data, isLoading } = useQuery({
    queryKey: ["metric-series", metricKey, days],
    queryFn: () => fetchSeries({ data: { metricKey, days } }),
  });

  const rows = (data?.rows ?? []) as Row[];
  const label =
    rows[0]?.display_name ?? metricKey.replace(/_/g, " ");
  const unit = rows[rows.length - 1]?.unit ?? null;
  const refLow = rows[rows.length - 1]?.reference_low ?? null;
  const refHigh = rows[rows.length - 1]?.reference_high ?? null;

  const chartData = rows
    .filter((r) => r.value != null)
    .map((r) => ({
      at: (r.measured_at ?? r.created_at).slice(0, 10),
      ts: new Date(r.measured_at ?? r.created_at).getTime(),
      v: r.value as number,
      report: r.report_documents?.title ?? "",
    }));

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 pb-24">
      <Link
        to="/reports"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Reports
      </Link>

      <div className="mt-4 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-4xl text-foreground capitalize">{label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "reading" : "readings"}
            {unit ? ` · ${unit}` : ""}
            {refLow != null && refHigh != null ? ` · reference ${refLow}–${refHigh}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-xs">
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRangeIdx(i)}
                className={`rounded-full px-3 py-1 transition-colors ${
                  i === rangeIdx ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => downloadCsv(`${metricKey}.csv`, rows)}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-secondary disabled:opacity-50"
          >
            <Download className="h-3 w-3" /> CSV
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        {isLoading ? (
          <div className="flex h-72 items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : chartData.length < 2 ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            Not enough numeric readings yet for a chart.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="at"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                {refLow != null && refHigh != null && (
                  <ReferenceArea
                    y1={refLow}
                    y2={refHigh}
                    fill="currentColor"
                    className="text-emerald-500"
                    fillOpacity={0.08}
                  />
                )}
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}${unit ? ` ${unit}` : ""}`, label]}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <MedicalDisclaimer variant="compact" className="mt-4" />

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Readings
        </h2>
        <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {rows.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">
              No readings yet.
            </li>
          )}
          {[...rows]
            .sort((a, b) =>
              (b.measured_at ?? b.created_at).localeCompare(a.measured_at ?? a.created_at),
            )
            .map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    {r.value != null ? (
                      <>
                        <span className="font-medium">{r.value}</span>
                        {r.unit ? <span className="text-muted-foreground"> {r.unit}</span> : null}
                      </>
                    ) : (
                      <span className="text-muted-foreground">{r.value_text ?? "–"}</span>
                    )}
                    {r.flag && r.flag !== "normal" && (
                      <span
                        className={`ml-2 text-[11px] uppercase tracking-wide ${
                          r.flag === "high" ? "text-rose-500" : "text-amber-500"
                        }`}
                      >
                        {r.flag}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {(r.measured_at ?? r.created_at).slice(0, 10)}
                    {r.report_documents?.title ? ` · ${r.report_documents.title}` : ""}
                  </p>
                </div>
                <Link
                  to="/reports/$reportId"
                  params={{ reportId: r.report_id }}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  View →
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}