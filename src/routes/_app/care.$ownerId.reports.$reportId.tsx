import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { caregiverReadReport } from "@/lib/care.functions";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { useRouteTheme } from "@/lib/use-route-theme";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute(
  "/_app/care/$ownerId/reports/$reportId",
)({
  head: () => ({ meta: [{ title: "Report · Care · Purple" }] }),
  params: {
    parse: (raw: Record<string, string>) => {
      if (!UUID_RE.test(raw.ownerId ?? "") || !UUID_RE.test(raw.reportId ?? "")) {
        throw new Error("bad-id");
      }
      return { ownerId: raw.ownerId, reportId: raw.reportId };
    },
    stringify: (p) => ({ ownerId: p.ownerId, reportId: p.reportId }),
  },
  component: CaregiverReportDetail,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm text-destructive">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Report not found.</div>,
});

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

function CaregiverReportDetail() {
  useRouteTheme("dark");
  const { ownerId, reportId } = Route.useParams();
  const fetchReport = useServerFn(caregiverReadReport);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["care-report", ownerId, reportId],
    queryFn: () => fetchReport({ data: { owner_id: ownerId, report_id: reportId } }),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm text-destructive">
          {(error as Error)?.message ?? "Couldn't load this report."}
        </p>
      </div>
    );
  }

  const report = data!.report;
  const metrics = data!.metrics;
  const summary = (report.ai_summary ?? null) as
    | { summary?: string; flagged?: Array<{ metric: string; value?: string; concern?: string }> }
    | null;

  const byPanel: Record<string, typeof metrics> = {};
  for (const m of metrics) {
    const key = m.panel ?? "other";
    (byPanel[key] ??= []).push(m);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 space-y-6">
      <Link
        to="/care/$ownerId"
        params={{ ownerId }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to care view
      </Link>

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span>{report.report_type ?? "Report"}</span>
          {report.report_date && <span>· {report.report_date}</span>}
          {report.lab_name && <span>· {report.lab_name}</span>}
        </div>
        <h1 className="text-2xl font-serif text-foreground">{report.title}</h1>
        <p className="text-xs text-muted-foreground">Read-only view shared with you.</p>
      </header>

      {summary?.summary && (
        <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-medium text-foreground">Plain-English summary</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{summary.summary}</p>
          {Array.isArray(summary.flagged) && summary.flagged.length > 0 && (
            <ul className="text-sm text-foreground/90 space-y-1 list-disc pl-5">
              {summary.flagged.map((f, i) => (
                <li key={i}>
                  <span className="font-medium">{f.metric}</span>
                  {f.value ? ` — ${f.value}` : ""}
                  {f.concern ? `. ${f.concern}` : ""}
                </li>
              ))}
            </ul>
          )}
          <MedicalDisclaimer />
        </section>
      )}

      {metrics.length === 0 ? (
        report.status === "processing" ? (
          <p className="text-sm text-muted-foreground">Still extracting values…</p>
        ) : (
          <p className="text-sm text-muted-foreground">No metrics were extracted from this report.</p>
        )
      ) : (
        <section className="space-y-5">
          {Object.entries(byPanel).map(([panel, rows]) => (
            <div key={panel} className="rounded-2xl border border-border bg-card overflow-hidden">
              <h3 className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                {PANEL_LABELS[panel] ?? panel}
              </h3>
              <ul className="divide-y divide-border">
                {rows.map((m) => {
                  const display = m.display_name ?? m.metric_key;
                  const valueStr =
                    m.value != null
                      ? `${m.value}${m.unit ? " " + m.unit : ""}`
                      : (m.value_text ?? "—");
                  const flagColor =
                    m.flag === "high" || m.flag === "low" || m.flag === "abnormal"
                      ? "text-amber-500"
                      : "text-foreground";
                  return (
                    <li key={m.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{display}</p>
                        {(m.reference_low != null || m.reference_high != null) && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {m.reference_low ?? "—"} – {m.reference_high ?? "—"}
                            {m.unit ? ` ${m.unit}` : ""}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm tabular-nums ${flagColor}`}>{valueStr}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}