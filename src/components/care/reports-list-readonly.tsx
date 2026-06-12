import * as React from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Loader2, AlertCircle, ChevronRight } from "lucide-react";

type Report = {
  id: string;
  title: string;
  report_type: string | null;
  report_date: string | null;
  file_mime: string;
  status: string;
  created_at: string;
};

/**
 * Read-only grouped reports list mirroring /reports for caregivers.
 * No upload button, no link to per-report page (Step 1 covered reports
 * read-only; per-report caregiver view is a future step).
 */
export function ReportsListReadOnly({ reports, ownerId }: { reports: Report[]; ownerId: string }) {
  const grouped = React.useMemo(() => {
    const byType: Record<string, Report[]> = {};
    for (const r of reports) {
      const key = r.report_type ?? "uncategorized";
      (byType[key] ??= []).push(r);
    }
    return byType;
  }, [reports]);

  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <FileText className="h-6 w-6 mx-auto text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">No reports uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([type, rows]) => (
        <div key={type}>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            {type.replace(/_/g, " ")} · {rows.length}
          </h3>
          <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  to="/care/$ownerId/reports/$reportId"
                  params={{ ownerId, reportId: r.id }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
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
                      {r.status === "ready" && "Ready"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
