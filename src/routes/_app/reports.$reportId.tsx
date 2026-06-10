import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trash2, ExternalLink, TrendingUp, ShieldCheck, AlertTriangle, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouteTheme } from "@/lib/use-route-theme";
import { getReport, deleteReport, getMetricTrend, processReport, setReportIdentityDecision, getReportFileUrl } from "@/lib/reports.functions";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { ReportShell, ReportCard, ReportPill } from "@/components/reports/report-shell";
import { ProGate } from "@/components/pro/pro-gate";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/_app/reports/$reportId")({
  head: () => ({ meta: [{ title: "Report · Purple" }] }),
  params: {
    parse: (raw: Record<string, string>) => {
      if (!UUID_RE.test(raw.reportId ?? "")) {
        throw new Error("not-a-report-id");
      }
      return { reportId: raw.reportId };
    },
    stringify: (p: { reportId: string }) => ({ reportId: p.reportId }),
  },
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
  useRouteTheme("dark");
  const { reportId } = Route.useParams();
  const navigate = useNavigate();
  const fetchReport = useServerFn(getReport);
  const removeReport = useServerFn(deleteReport);
  const reprocess = useServerFn(processReport);
  const decideIdentity = useServerFn(setReportIdentityDecision);
  const fetchFileUrl = useServerFn(getReportFileUrl);
  const [openingFile, setOpeningFile] = React.useState<null | "view" | "download" | "share">(null);
  const [retrying, setRetrying] = React.useState(false);
  const [deciding, setDeciding] = React.useState(false);
  const [selectedMetric, setSelectedMetric] = React.useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => fetchReport({ data: { id: reportId } }),
    enabled: UUID_RE.test(reportId ?? ""),
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
      navigate({ to: "/reports/documents" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await reprocess({ data: { reportId } });
      toast.success("Re-running extraction…");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <ReportShell title="Clinical report" back={{ to: "/reports/documents", label: "Reports" }}>
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </ReportShell>
    );
  }

  const report = data?.report;
  const metrics = (data?.metrics ?? []) as Metric[];
  const signedUrl = data?.signedUrl;

  async function openOrShare(kind: "view" | "download" | "share") {
    setOpeningFile(kind);
    try {
      const { url, title } = await fetchFileUrl({ data: { id: reportId } });
      if (kind === "view") {
        const win = window.open(url, "_blank", "noopener,noreferrer");
        if (!win) {
          // Pop-up blocked: copy URL as a fallback so the user can paste/open.
          await navigator.clipboard.writeText(url);
          toast.success("Pop-up blocked. Link copied to clipboard.");
        }
      } else if (kind === "download") {
        const a = document.createElement("a");
        a.href = url;
        a.download = title ?? "report";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        // Share: copy a fresh signed URL.
        if (navigator.share) {
          try {
            await navigator.share({ title: title ?? "Purple report", url });
          } catch {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied to clipboard");
          }
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open file");
    } finally {
      setOpeningFile(null);
    }
  }
  const identityStatus = (report as { identity_status?: string } | undefined)?.identity_status;
  const duplicateOf = (report as { duplicate_of?: string | null } | undefined)?.duplicate_of ?? null;
  const patientName = (report as { patient_name?: string | null } | undefined)?.patient_name ?? null;
  const patientDob = (report as { patient_dob?: string | null } | undefined)?.patient_dob ?? null;

  if (!report) {
    return (
      <ReportShell title="Clinical report" back={{ to: "/reports/documents", label: "Reports" }}>
        <p className="text-white/70">Report not found.</p>
      </ReportShell>
    );
  }

  const statusTone: "success" | "alert" | "warning" =
    report.status === "ready" ? "success" :
    report.status === "failed" ? "alert" :
    "warning";
  const statusLabel =
    report.status === "ready" ? "Ready" :
    report.status === "failed" ? "Failed" :
    "Processing";

  return (
    <ReportShell title="Clinical report" back={{ to: "/reports/documents", label: "Reports" }}>
      <section className="report-card-strong p-6 sm:p-8">
        <ReportPill tone={statusTone}>{statusLabel}</ReportPill>
        <h2 className="mt-4 font-serif text-3xl sm:text-4xl text-white leading-tight break-words">
          {report.title}
        </h2>
        <p className="mt-2 text-sm text-white/65">
          {report.report_date ?? new Date(report.created_at).toLocaleDateString()}
          {report.report_type ? ` · ${report.report_type.replace(/_/g, " ")}` : ""}
          {metrics.length > 0 ? ` · ${metrics.length} value${metrics.length === 1 ? "" : "s"}` : ""}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            onClick={() => void openOrShare("view")}
            disabled={openingFile !== null}
            size="sm"
            className="rounded-full bg-white text-[#07090C] hover:bg-white/90"
          >
            {openingFile === "view" ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-1.5" />
            )}
            View file
          </Button>
          <Button
            onClick={() => void openOrShare("download")}
            disabled={openingFile !== null}
            variant="ghost"
            size="sm"
            className="rounded-full text-white/85 hover:bg-white/5 hover:text-white"
          >
            {openingFile === "download" ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            Download
          </Button>
          <ProGate feature="report_sharing" variant="inline">
            <Button
              onClick={() => void openOrShare("share")}
              disabled={openingFile !== null}
              variant="ghost"
              size="sm"
              className="rounded-full text-white/85 hover:bg-white/5 hover:text-white"
            >
              {openingFile === "share" ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-1.5" />
              )}
              Share
            </Button>
          </ProGate>
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="rounded-full text-[#FFA8BD] hover:bg-white/5 hover:text-[#FFA8BD]"
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
        </div>
      </section>

      {report.summary && (
        <section className="mt-6 report-card">
          <p className="report-eyebrow text-white/55">Summary</p>
          <p className="mt-3 text-[15px] text-white/85 leading-relaxed whitespace-pre-wrap">{report.summary}</p>
        </section>
      )}

      {(report.findings || report.impressions) && (
        <section className="mt-4 grid sm:grid-cols-2 gap-4">
          {report.findings && Array.isArray(report.findings) && (report.findings as string[]).length > 0 && (
            <div className="report-card">
              <p className="report-eyebrow text-white/55">Findings</p>
              <ul className="mt-3 text-sm text-white/85 space-y-1.5 list-disc pl-4 marker:text-white/40">
                {(report.findings as string[]).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
          {report.impressions && Array.isArray(report.impressions) && (report.impressions as string[]).length > 0 && (
            <div className="report-card">
              <p className="report-eyebrow text-white/55">Impressions</p>
              <ul className="mt-3 text-sm text-white/85 space-y-1.5 list-disc pl-4 marker:text-white/40">
                {(report.impressions as string[]).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {report.status === "processing" && (
        <ReportCard className="mt-6">
          <div className="flex items-center gap-2 text-sm text-[#F3D58B]">
            <Loader2 className="h-4 w-4 animate-spin" /> Extracting values… this can take up to a minute.
          </div>
        </ReportCard>
      )}
      {report.status === "failed" && (
        <ReportCard className="mt-6">
          <p className="text-sm text-[#FFA8BD]">Extraction failed: {report.error_message ?? "Unknown error"}</p>
          <Button
            onClick={() => void handleRetry()}
            disabled={retrying}
            size="sm"
            className="mt-3 rounded-full bg-white text-[#07090C] hover:bg-white/90"
          >
            {retrying ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Retrying…
              </>
            ) : (
              "Retry"
            )}
          </Button>
        </ReportCard>
      )}

      {report.status === "ready" && (identityStatus === "mismatch" || identityStatus === "unverified" || duplicateOf) && (
        <ReportCard className="mt-6 border-[#F3D58B]/30 bg-[#F3D58B]/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[#F3D58B]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">
                {duplicateOf
                  ? "Possible duplicate report"
                  : identityStatus === "mismatch"
                    ? "Patient details don't match your profile"
                    : "We couldn't verify whose report this is"}
              </p>
              <p className="mt-1 text-xs text-white/65 leading-relaxed">
                {duplicateOf
                  ? "Another report on the same date already has overlapping values. Its metrics are excluded from trends to avoid double-counting."
                  : `Found on the document: ${patientName ?? "no name"}${patientDob ? `, DOB ${patientDob}` : ""}. Its metrics are hidden from your trends until you confirm.`}
              </p>
              {!duplicateOf && (
                <p className="mt-2 text-xs text-white/55 leading-relaxed">
                  Approving remembers this name and date of birth so future uploads that match are auto-approved. Rejecting deletes this report and blocks re-uploads of the same readings.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  onClick={async () => {
                    setDeciding(true);
                    try {
                      await decideIdentity({ data: { reportId, decision: "approve" } });
                      toast.success("Approved. We'll remember this identity for future uploads.");
                      await refetch();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed");
                    } finally {
                      setDeciding(false);
                    }
                  }}
                  disabled={deciding}
                  size="sm"
                  className="rounded-full bg-white text-[#07090C] hover:bg-white/90"
                >
                  Yes, this is me
                </Button>
                <Button
                  onClick={async () => {
                    if (!confirm("Delete this report?")) return;
                    setDeciding(true);
                    try {
                      await decideIdentity({ data: { reportId, decision: "reject" } });
                      toast.success("Report deleted");
                      navigate({ to: "/reports/documents" });
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Failed");
                      setDeciding(false);
                    }
                  }}
                  disabled={deciding}
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-[#FFA8BD] hover:bg-white/5 hover:text-[#FFA8BD]"
                >
                  Not me, delete it
                </Button>
              </div>
            </div>
          </div>
        </ReportCard>
      )}

      {metrics.length > 0 && (
        <PanelGroups
          metrics={metrics}
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
        />
      )}

      {report.status === "ready" && metrics.length === 0 && (
        <p className="mt-6 text-sm text-white/65">
          No structured values extracted. You can still view the original file above.
        </p>
      )}

      <ReportCard className="mt-10">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/75 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-white text-base font-medium">Medical disclaimer</h3>
            <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
              Values shown here are extracted from the document you uploaded and surfaced for personal
              context and pattern-tracking. Purple is not a laboratory or healthcare provider. Always
              discuss results with your medical practitioner.
            </p>
          </div>
        </div>
      </ReportCard>
      <MedicalDisclaimer className="mt-4 text-white/70 [&_*]:text-white/70" />
    </ReportShell>
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