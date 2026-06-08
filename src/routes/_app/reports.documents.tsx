import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  Upload,
  Loader2,
  ChevronRight,
  AlertCircle,
  ShieldCheck,
  FlaskConical,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listReports } from "@/lib/reports.functions";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { useTranslation } from "react-i18next";
import { ConditionSuggestionsCard } from "@/components/reports/condition-suggestions-card";
import { QuickClinicianPdf } from "@/components/reports/quick-clinician-pdf";
import { ReportShell, ReportCard, ReportPill } from "@/components/reports/report-shell";
import { ReportsTabs } from "@/components/reports/reports-tabs";
import { ReportRowActions } from "@/components/reports/report-row-actions";

export const Route = createFileRoute("/_app/reports/documents")({
  head: () => ({
    meta: [
      { title: "Reports · Purple" },
      { name: "description", content: "Your uploaded lab reports and clinician PDFs." },
    ],
  }),
  component: ReportsDocumentsPage,
});

type ReportRow = {
  id: string;
  title: string;
  report_type: string | null;
  report_date: string | null;
  file_mime: string;
  status: string;
  created_at: string;
  metric_count?: number;
  summary?: string | null;
  panel_keys?: string[] | null;
  error_message?: string | null;
};

/** Storage-hash-looking titles render as "Untitled upload" so the row stays readable. */
function displayTitle(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "Untitled upload";
  // No spaces, long, and looks like a hash/slug (mixed alnum with - or _)
  if (!/\s/.test(t) && t.length > 28 && /[A-Za-z]/.test(t) && /[0-9]/.test(t)) {
    return "Untitled upload";
  }
  return t;
}

function ReportsDocumentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fetchList = useServerFn(listReports);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: () => fetchList(),
    refetchInterval: (q) => {
      const reports = (q.state.data as { reports: ReportRow[] } | undefined)?.reports ?? [];
      return reports.some((r) => r.status === "processing") ? 3000 : false;
    },
  });

  const reports = (data?.reports ?? []) as ReportRow[];
  const [query, setQuery] = React.useState("");
  const [yearFilter, setYearFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const yearOf = (r: ReportRow) => {
    const d = r.report_date ?? r.created_at;
    return d ? new Date(d).getFullYear().toString() : "unknown";
  };
  const years = React.useMemo(() => {
    const s = new Set<string>();
    for (const r of reports) s.add(yearOf(r));
    return Array.from(s).sort((a, b) => b.localeCompare(a));
  }, [reports]);
  const types = React.useMemo(() => {
    const s = new Set<string>();
    for (const r of reports) s.add(r.report_type ?? "uncategorized");
    return Array.from(s).sort();
  }, [reports]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (yearFilter !== "all" && yearOf(r) !== yearFilter) return false;
      if (typeFilter !== "all" && (r.report_type ?? "uncategorized") !== typeFilter) return false;
      if (statusFilter !== "all") {
        const isFailedAny =
          r.status === "failed" || r.status === "needs_credits" || r.status === "rate_limited";
        if (statusFilter === "failed" && !isFailedAny) return false;
        if (statusFilter !== "failed" && r.status !== statusFilter) return false;
      }
      if (q) {
        const hay = `${r.title ?? ""} ${r.report_type ?? ""} ${r.summary ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reports, query, yearFilter, typeFilter, statusFilter]);
  const grouped = React.useMemo(() => {
    const byType: Record<string, ReportRow[]> = {};
    for (const r of filtered) {
      const key = r.report_type ?? "uncategorized";
      (byType[key] ??= []).push(r);
    }
    return byType;
  }, [filtered]);

  const latest = reports[0];
  const processingCount = reports.filter((r) => r.status === "processing").length;
  const readyCount = reports.filter((r) => r.status === "ready").length;
  const metricsTotal = reports.reduce((s, r) => s + (r.metric_count ?? 0), 0);

  return (
    <ReportShell title={t("reports.title")}>
      <ReportsTabs />

      {/* Hero summary */}
      <section className="report-card-strong p-6 sm:p-8">
        <p className="report-eyebrow text-white/70">Your labs</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl text-white leading-tight">
          {latest
            ? "A quiet ledger of what your body has been telling you."
            : "Start your private ledger of lab results."}
        </h2>
        <p className="mt-3 text-[15px] text-white/65 max-w-[520px]">{t("reports.intro")}</p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Reports" value={reports.length} />
          <Stat label="Metrics tracked" value={metricsTotal} />
          <Stat
            label={processingCount > 0 ? "Processing" : "Ready"}
            value={processingCount > 0 ? processingCount : readyCount}
            tone={processingCount > 0 ? "warning" : "success"}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => navigate({ to: "/reports/new" })}
            className="rounded-full bg-white text-[#07090C] hover:bg-white/90"
          >
            <Upload className="h-4 w-4 mr-2" /> {t("reports.upload")}
          </Button>
          {latest && (
            <Link
              to="/reports/$reportId"
              params={{ reportId: latest.id }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5"
            >
              Open latest <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {/* Search */}
      {reports.length > 0 && (
        <div className="mt-6 space-y-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports by title or type…"
            className="rounded-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          <FilterRow label="Year" value={yearFilter} onChange={setYearFilter} options={[{ v: "all", l: "All" }, ...years.map((y) => ({ v: y, l: y }))]} />
          <FilterRow label="Type" value={typeFilter} onChange={setTypeFilter} options={[{ v: "all", l: "All" }, ...types.map((tp) => ({ v: tp, l: tp.replace(/_/g, " ") }))]} />
          <FilterRow label="Status" value={statusFilter} onChange={setStatusFilter} options={[
            { v: "all", l: "All" },
            { v: "ready", l: "Ready" },
            { v: "processing", l: "Processing" },
            { v: "failed", l: "Failed" },
          ]} />
        </div>
      )}

      {/* Reports list */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-white">
            <FileText className="h-4 w-4 text-white/70" />
            <h2 className="font-serif text-2xl">Contributing reports</h2>
          </div>
          {reports.some((r) => r.status === "processing") && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-xs text-white/55 hover:text-white"
            >
              Refresh
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("reports.loading")}
          </div>
        ) : reports.length === 0 ? (
          <ReportCard className="mt-4 text-center">
            <FlaskConical className="h-10 w-10 mx-auto text-white/40" />
            <p className="mt-3 text-sm text-white/65">{t("reports.emptyBody")}</p>
            <Button
              onClick={() => navigate({ to: "/reports/new" })}
              className="mt-5 rounded-full bg-white text-[#07090C] hover:bg-white/90"
            >
              <Upload className="h-4 w-4 mr-2" /> Upload report
            </Button>
          </ReportCard>
        ) : filtered.length === 0 ? (
          <ReportCard className="mt-4 text-center">
            <p className="text-sm text-white/65">No reports match these filters.</p>
            <button
              type="button"
              onClick={() => { setYearFilter("all"); setTypeFilter("all"); setStatusFilter("all"); setQuery(""); }}
              className="mt-3 text-xs text-white/70 underline hover:text-white"
            >
              Clear filters
            </button>
          </ReportCard>
        ) : (
          <div className="mt-4 space-y-6">
            {Object.entries(grouped).map(([type, rows]) => (
              <div key={type}>
                <p className="report-eyebrow text-white/55 mb-2">
                  {type.replace(/_/g, " ")} · {rows.length}
                </p>
                <ul className="space-y-2">
                  {rows.map((r) => {
                    const isFailed =
                      r.status === "failed" ||
                      r.status === "needs_credits" ||
                      r.status === "rate_limited";
                    const failedLabel =
                      r.status === "needs_credits"
                        ? "Needs AI credits"
                        : r.status === "rate_limited"
                          ? "Rate limited, try again"
                          : "Extraction failed";
                    return (
                    <li key={r.id} className="report-card overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-3 sm:px-5 sm:py-4">
                        <Link
                          to="/reports/$reportId"
                          params={{ reportId: r.id }}
                          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90"
                        >
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/75 shrink-0">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] text-white truncate" title={r.title}>
                              {displayTitle(r.title)}
                            </p>
                            <p className="mt-0.5 text-xs text-white/55">
                              {r.report_date ?? new Date(r.created_at).toLocaleDateString()}
                              {" · "}
                              {r.status === "processing" && (
                                <span className="inline-flex items-center gap-1 text-[#F3D58B]">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Extracting…
                                </span>
                              )}
                              {isFailed && (
                                <span className="inline-flex items-center gap-1 text-[#FFA8BD]">
                                  <AlertCircle className="h-3 w-3" /> {failedLabel}
                                </span>
                              )}
                              {r.status === "ready" &&
                                ((r.metric_count ?? 0) > 0
                                  ? `${r.metric_count} metric${r.metric_count === 1 ? "" : "s"}`
                                  : "Ready")}
                            </p>
                            {isFailed && r.error_message && (
                              <p
                                className="mt-1 text-xs text-[#FFA8BD]/70 line-clamp-2"
                                title={r.error_message}
                              >
                                {r.error_message.length > 160
                                  ? `${r.error_message.slice(0, 160)}…`
                                  : r.error_message}
                              </p>
                            )}
                          </div>
                        </Link>
                        <ReportRowActions
                          reportId={r.id}
                          status={r.status}
                          onChanged={() => void refetch()}
                        />
                      </div>
                      {(r.summary || (r.panel_keys && r.panel_keys.length > 0)) && (
                        <div className="px-3 pb-4 sm:px-5">
                          {r.summary && (
                            <p className="text-xs text-white/70 leading-relaxed line-clamp-3">{r.summary}</p>
                          )}
                          {r.panel_keys && r.panel_keys.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {r.panel_keys.map((p) => (
                                <ReportPill key={p}>{p.replace(/_/g, " ")}</ReportPill>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Clinician PDF + suggestions */}
      <div className="mt-12 space-y-10">
        <QuickClinicianPdf />
        <ConditionSuggestionsCard />
      </div>

      {/* Privacy + medical note */}
      <section className="mt-12 space-y-4">
        <ReportCard>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/75 shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-white text-base font-medium">Your Privacy Is Our Priority</h3>
              <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
                Reports and the values Purple extracts are encrypted at rest and only readable by you and the
                people you explicitly share with. You can export or delete any report at any time.
              </p>
            </div>
          </div>
        </ReportCard>
        <ReportCard>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/75 shrink-0">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-white text-base font-medium">Important Note</h3>
              <p className="mt-1.5 text-sm text-white/65 leading-relaxed">
                Purple is not a laboratory or healthcare provider. The values you see here are extracted from
                documents you upload and surfaced for context and pattern-tracking, not for diagnosis or
                treatment. Always discuss results with your medical practitioner.
              </p>
            </div>
          </div>
        </ReportCard>
        <MedicalDisclaimer className="text-white/70 [&_*]:text-white/70" />
      </section>
    </ReportShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning";
}) {
  const valueCls =
    tone === "success" ? "text-[#5CE0AC]" :
    tone === "warning" ? "text-[#F3D58B]" :
    "text-white";
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 sm:px-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{label}</p>
      <p className={`mt-2 numeric text-2xl font-light ${valueCls}`}>{value}</p>
    </div>
  );
}

function FilterRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ v: string; l: string }>;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = o.v === value;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={
                "rounded-full px-3 py-1 text-xs transition capitalize " +
                (active
                  ? "bg-white text-[#07090C]"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10")
              }
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}