import * as React from "react";
import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Upload, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouteTheme } from "@/lib/use-route-theme";
import { listReports } from "@/lib/reports.functions";
import { MedicalDisclaimer } from "@/components/common/medical-disclaimer";
import { useTranslation } from "react-i18next";
import { TrendsSection } from "@/components/reports/trends-section";
import { ConditionSuggestionsCard } from "@/components/reports/condition-suggestions-card";
import { QuickClinicianPdf } from "@/components/reports/quick-clinician-pdf";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Purple" },
      { name: "description", content: "Upload lab reports and track changes over time." },
    ],
  }),
  component: ReportsLayout,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="text-sm text-destructive">Couldn't load reports: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function ReportsLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/reports") return <Outlet />;
  return <ReportsPage />;
}

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
};

function ReportsPage() {
  useRouteTheme("light");
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
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        (r.report_type ?? "").toLowerCase().includes(q),
    );
  }, [reports, query]);
  const grouped = React.useMemo(() => {
    const byType: Record<string, ReportRow[]> = {};
    for (const r of filtered) {
      const key = r.report_type ?? "uncategorized";
      (byType[key] ??= []).push(r);
    }
    return byType;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-10 sm:pt-16 pb-24">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl text-foreground">{t("reports.title")}</h1>
          <p className="mt-2 text-foreground/75 max-w-[560px]">
            {t("reports.intro")}
          </p>
        </div>
        <Button
          onClick={() => navigate({ to: "/reports/new" })}
          className="rounded-full"
        >
          <Upload className="h-4 w-4 mr-2" /> {t("reports.upload")}
        </Button>
      </div>

      <MedicalDisclaimer className="mt-6" />

      <QuickClinicianPdf />
      <ConditionSuggestionsCard />

      {reports.length > 0 && (
        <div className="mt-6">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports by title or type…"
            className="rounded-full"
          />
        </div>
      )}

      <section className="mt-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("reports.loading")}
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t("reports.emptyBody")}
            </p>
            <Button
              onClick={() => navigate({ to: "/reports/new" })}
              className="mt-5 rounded-full"
            >
              <Upload className="h-4 w-4 mr-2" /> Upload report
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, rows]) => (
              <div key={type}>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  {type.replace(/_/g, " ")} · {rows.length}
                </h2>
                <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {rows.map((r) => (
                    <li key={r.id}>
                      <Link
                        to="/reports/$reportId"
                        params={{ reportId: r.id }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground truncate">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.report_date ?? new Date(r.created_at).toLocaleDateString()}
                            {" · "}
                            {r.status === "processing" && (
                              <span className="inline-flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" /> Extracting…
                              </span>
                            )}
                            {r.status === "failed" && (
                              <span className="inline-flex items-center gap-1 text-destructive">
                                <AlertCircle className="h-3 w-3" /> Extraction failed
                              </span>
                            )}
                            {r.status === "ready" &&
                              ((r.metric_count ?? 0) > 0
                                ? `${r.metric_count} metric${r.metric_count === 1 ? "" : "s"}`
                                : "Ready")}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                      {(r.summary || (r.panel_keys && r.panel_keys.length > 0)) && (
                        <div className="px-4 pb-3 -mt-1">
                          {r.summary && (
                            <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{r.summary}</p>
                          )}
                          {r.panel_keys && r.panel_keys.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {r.panel_keys.map((p) => (
                                <span key={p} className="inline-flex items-center rounded-full bg-accent/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {p.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {reports.some((r) => r.status === "processing") && (
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground"
        >
          Refresh
        </button>
      )}

      <TrendsSection />
    </div>
  );
}