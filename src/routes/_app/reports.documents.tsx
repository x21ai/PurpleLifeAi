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
  RefreshCw,
  Download,
  List,
  CalendarRange,
} from "lucide-react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listReports, processReport, bulkDownloadReports } from "@/lib/reports.functions";
import { toast } from "sonner";
import JSZip from "jszip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { useTranslation } from "react-i18next";
import { ConditionSuggestionsCard } from "@/components/reports/condition-suggestions-card";
import { QuickClinicianPdf } from "@/components/reports/quick-clinician-pdf";
import { ReportShell, ReportCard, ReportPill } from "@/components/reports/report-shell";
import { ReportsTabs } from "@/components/reports/reports-tabs";
import { ReportRowActions } from "@/components/reports/report-row-actions";
import {
  REPORT_CATEGORIES,
  getReportCategoryMeta,
  type ReportCategorySlug,
} from "@/lib/report-categories";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  category: fallback(z.string().optional(), undefined),
});

export const Route = createFileRoute("/_app/reports/documents")({
  head: () => ({
    meta: [
      { title: "Reports · Purple" },
      { name: "description", content: "Your uploaded lab reports and clinician PDFs." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: ReportsDocumentsPage,
});

type ReportRow = {
  id: string;
  title: string;
  report_type: string | null;
  report_category?: string | null;
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
  const search = Route.useSearch();
  const activeCategory = (search.category ?? null) as ReportCategorySlug | null;
  const fetchList = useServerFn(listReports);
  const reprocessOne = useServerFn(processReport);
  const fetchBulkUrls = useServerFn(bulkDownloadReports);
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
  const [bulkRetrying, setBulkRetrying] = React.useState(false);
  const [bulkDownloading, setBulkDownloading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"list" | "timeline">(() => {
    if (typeof window === "undefined") return "list";
    return (localStorage.getItem("purple-reports-view") as "list" | "timeline") || "list";
  });
  React.useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("purple-reports-view", viewMode);
  }, [viewMode]);

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
      if (activeCategory && (r.report_category ?? "other") !== activeCategory) return false;
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
  }, [reports, query, yearFilter, typeFilter, statusFilter, activeCategory]);
  const grouped = React.useMemo(() => {
    // Group by Year → Month, newest first. This matches user expectation:
    // "latest on top broken by year and month".
    const byMonth: Record<string, ReportRow[]> = {};
    const sorted = [...filtered].sort((a, b) => {
      const da = a.report_date ?? a.created_at;
      const db = b.report_date ?? b.created_at;
      return (db ?? "").localeCompare(da ?? "");
    });
    for (const r of sorted) {
      const iso = r.report_date ?? r.created_at;
      const d = iso ? new Date(iso) : null;
      const key = d && !Number.isNaN(d.getTime())
        ? d.toLocaleDateString(undefined, { year: "numeric", month: "long" })
        : "Date unknown";
      (byMonth[key] ??= []).push(r);
    }
    return byMonth;
  }, [filtered]);

  // Year → Month nested grouping for the timeline view.
  const groupedByYear = React.useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const da = a.report_date ?? a.created_at;
      const db = b.report_date ?? b.created_at;
      return (db ?? "").localeCompare(da ?? "");
    });
    const byYear = new Map<string, Map<string, ReportRow[]>>();
    for (const r of sorted) {
      const iso = r.report_date ?? r.created_at;
      const d = iso ? new Date(iso) : null;
      const year = d && !Number.isNaN(d.getTime()) ? String(d.getFullYear()) : "Unknown";
      const month = d && !Number.isNaN(d.getTime())
        ? d.toLocaleDateString(undefined, { month: "long" })
        : "Date unknown";
      let yearMap = byYear.get(year);
      if (!yearMap) { yearMap = new Map(); byYear.set(year, yearMap); }
      const list = yearMap.get(month) ?? [];
      list.push(r);
      yearMap.set(month, list);
    }
    return byYear;
  }, [filtered]);

  const latest = reports[0];
  const processingCount = reports.filter((r) => r.status === "processing").length;
  const readyCount = reports.filter((r) => r.status === "ready").length;
  const failedReports = reports.filter(
    (r) =>
      r.status === "failed" ||
      r.status === "needs_credits" ||
      r.status === "rate_limited",
  );
  const metricsTotal = reports.reduce((s, r) => s + (r.metric_count ?? 0), 0);

  async function bulkRerunFailed() {
    if (failedReports.length === 0) return;
    setBulkRetrying(true);
    let ok = 0;
    let fail = 0;
    for (const r of failedReports) {
      try {
        await reprocessOne({ data: { reportId: r.id } });
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    setBulkRetrying(false);
    if (ok > 0) {
      toast.success(`Re-queued ${ok} report${ok === 1 ? "" : "s"} for extraction.`);
    }
    if (fail > 0) {
      toast.error(`${fail} could not be re-queued. Try again in a moment.`);
    }
    await refetch();
  }

  async function downloadFilteredAsZip() {
    const readyOnes = filtered.filter((r) => r.status === "ready" || r.status === "processing" || r.status === "failed");
    if (readyOnes.length === 0) {
      toast.info("No reports to download.");
      return;
    }
    if (readyOnes.length > 200) {
      toast.error("Too many reports - narrow filters to under 200.");
      return;
    }
    setBulkDownloading(true);
    try {
      const { items } = await fetchBulkUrls({ data: { reportIds: readyOnes.map((r) => r.id) } });
      if (items.length === 0) {
        toast.error("Couldn't prepare downloads.");
        return;
      }
      const zip = new JSZip();
      let added = 0;
      for (const it of items) {
        try {
          const res = await fetch(it.url);
          if (!res.ok) continue;
          const buf = await res.arrayBuffer();
          zip.file(it.suggestedName, buf);
          added += 1;
        } catch {
          /* skip */
        }
      }
      if (added === 0) {
        toast.error("Couldn't download report files.");
        return;
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `purple-reports-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${added} report${added === 1 ? "" : "s"}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk download failed.");
    } finally {
      setBulkDownloading(false);
    }
  }

  return (
    <ReportShell title={t("reports.title")}>
      <ReportsTabs />

      {/* Category chips */}
      <div className="mt-2 mb-6 flex flex-wrap items-center gap-2">
        <Link
          to="/reports/documents"
          search={{ category: undefined }}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs transition",
            !activeCategory
              ? "border-white/30 bg-white/10 text-white"
              : "border-white/10 text-white/60 hover:text-white",
          )}
        >
          All
        </Link>
        {REPORT_CATEGORIES.filter((c) => c.slug !== "dna").map((c) => {
          const Icon = c.icon;
          const active = activeCategory === c.slug;
          return (
            <Link
              key={c.slug}
              to="/reports/documents"
              search={{ category: c.slug }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                active
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 text-white/60 hover:text-white",
              )}
            >
              <Icon className="h-3 w-3" />
              {c.short}
            </Link>
          );
        })}
      </div>

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
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Year"
              value={yearFilter}
              onChange={setYearFilter}
              options={[{ v: "all", l: "All years" }, ...years.map((y) => ({ v: y, l: y }))]}
            />
            <FilterSelect
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { v: "all", l: "All types" },
                ...types.map((tp) => ({ v: tp, l: tp.replace(/_/g, " ") })),
              ]}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { v: "all", l: "All statuses" },
                { v: "ready", l: "Ready" },
                { v: "processing", l: "Processing" },
                { v: "failed", l: "Failed" },
              ]}
            />
          </div>
        </div>
      )}

      {/* Bulk re-run failed banner */}
      {failedReports.length > 1 && (
        <div className="mt-4 rounded-2xl border border-[#FFA8BD]/25 bg-[#FFA8BD]/[0.06] p-3 sm:p-4 flex items-center gap-3 flex-wrap">
          <AlertCircle className="h-4 w-4 text-[#FFA8BD] shrink-0" />
          <p className="text-sm text-white/80 flex-1 min-w-[200px]">
            <span className="text-[#FFA8BD]">{failedReports.length}</span> reports failed
            extraction. Re-run them in one go.
          </p>
          <Button
            onClick={() => void bulkRerunFailed()}
            disabled={bulkRetrying}
            size="sm"
            className="rounded-full bg-white text-[#07090C] hover:bg-white/90"
          >
            {bulkRetrying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Re-running…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" /> Re-run all failed
              </>
            )}
          </Button>
        </div>
      )}

      {/* Reports list */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-white">
            <FileText className="h-4 w-4 text-white/70" />
            <h2 className="font-serif text-2xl">Contributing reports</h2>
          </div>
          <div className="flex items-center gap-2">
            {filtered.length > 0 && (
              <div className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition",
                    viewMode === "list" ? "bg-white/15 text-white" : "text-white/55 hover:text-white",
                  )}
                  title="List view"
                >
                  <List className="h-3 w-3" /> List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("timeline")}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition",
                    viewMode === "timeline" ? "bg-white/15 text-white" : "text-white/55 hover:text-white",
                  )}
                  title="Timeline view"
                >
                  <CalendarRange className="h-3 w-3" /> Timeline
                </button>
              </div>
            )}
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={() => void downloadFilteredAsZip()}
                disabled={bulkDownloading}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/75 hover:bg-white/5 disabled:opacity-50"
                title={`Download ${filtered.length} report${filtered.length === 1 ? "" : "s"} as a zip`}
              >
                {bulkDownloading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                {bulkDownloading ? "Zipping…" : `Download ${filtered.length}`}
              </button>
            )}
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
        ) : viewMode === "timeline" ? (
          <div className="mt-6 relative pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-white/10" aria-hidden />
            <div className="space-y-8">
              {Array.from(groupedByYear.entries()).map(([year, monthMap]) => {
                const yearCount = Array.from(monthMap.values()).reduce((s, a) => s + a.length, 0);
                return (
                  <div key={year} className="relative">
                    <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-white/80 ring-4 ring-[#07090C]" aria-hidden />
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-serif text-2xl text-white">{year}</h3>
                      <span className="text-xs text-white/45">· {yearCount} report{yearCount === 1 ? "" : "s"}</span>
                    </div>
                    <div className="mt-3 space-y-5">
                      {Array.from(monthMap.entries()).map(([month, rows]) => (
                        <div key={month} className="relative">
                          <div className="absolute -left-[14px] top-1.5 h-1.5 w-1.5 rounded-full bg-white/40" aria-hidden />
                          <p className="report-eyebrow text-white/55 mb-2">{month} · {rows.length}</p>
                          <ul className="space-y-2">
                            {rows.map((r) => {
                              const isFailed =
                                r.status === "failed" ||
                                r.status === "needs_credits" ||
                                r.status === "rate_limited";
                              const meta = getReportCategoryMeta(r.report_category ?? null);
                              const Icon = meta.icon;
                              return (
                                <li key={r.id} className="report-card overflow-hidden">
                                  <Link
                                    to="/reports/$reportId"
                                    params={{ reportId: r.id }}
                                    className="flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-3 hover:opacity-90"
                                  >
                                    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full shrink-0", meta.tone)} title={meta.label}>
                                      <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[14px] text-white truncate">{displayTitle(r.title)}</p>
                                      <p className="mt-0.5 text-[11px] text-white/55">
                                        {r.report_date ?? new Date(r.created_at).toLocaleDateString()}
                                        {r.status === "ready" && (r.metric_count ?? 0) > 0 && ` · ${r.metric_count} metric${r.metric_count === 1 ? "" : "s"}`}
                                        {r.status === "processing" && " · Extracting…"}
                                        {isFailed && " · needs attention"}
                                      </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {Object.entries(grouped).map(([monthLabel, rows]) => (
              <div key={monthLabel}>
                <p className="report-eyebrow text-white/55 mb-2">
                  {monthLabel} · {rows.length}
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
                          {(() => {
                            const meta = getReportCategoryMeta(r.report_category ?? null);
                            const Icon = meta.icon;
                            return (
                              <span
                                className={cn(
                                  "inline-flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                                  meta.tone,
                                )}
                                title={meta.label}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                            );
                          })()}
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

function FilterSelect({
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
    <div className="inline-flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-white/45 shrink-0">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 min-w-[140px] rounded-full bg-white/5 border-white/10 text-white text-xs px-3 hover:bg-white/10 focus:ring-white/20 capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#0F1418] border-white/10 text-white">
          {options.map((o) => (
            <SelectItem
              key={o.v}
              value={o.v}
              className="text-white focus:bg-white/10 focus:text-white capitalize"
            >
              {o.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}