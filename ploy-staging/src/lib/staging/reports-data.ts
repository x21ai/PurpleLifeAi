import { stagingFrom } from "./api-query";
import { formatReportDate } from "./format";

export type ReportDocumentRow = {
  id: string;
  title: string;
  report_type: string | null;
  report_date: string | null;
  file_mime: string;
  status: string;
  summary: string | null;
  user_decision: string | null;
  created_at: string;
};

export type ReportListItem = {
  id: string;
  title: string;
  detail: string;
  date: string;
  kind: "PDF" | "JPEG" | "OTHER";
  archived: boolean;
  status: string;
  summary: string | null;
};

export type MedicalReportRow = {
  id: string;
  created_at: string;
  window_from: string | null;
  window_to: string | null;
  file_path: string | null;
};

function mimeKind(mime: string): ReportListItem["kind"] {
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "JPEG";
  return "OTHER";
}

function isArchived(row: ReportDocumentRow): boolean {
  return row.status === "rejected" || row.user_decision === "rejected";
}

export function mapReportDocument(row: ReportDocumentRow): ReportListItem {
  const title = row.title?.trim() || "Untitled report";
  const date = formatReportDate(row.report_date ?? row.created_at);
  const typeLabel = row.report_type?.replace(/_/g, " ") ?? "Report";
  return {
    id: row.id,
    title,
    detail: `${typeLabel} · ${row.status}`,
    date,
    kind: mimeKind(row.file_mime ?? ""),
    archived: isArchived(row),
    status: row.status,
    summary: row.summary,
  };
}

export async function fetchReportDocuments(): Promise<ReportListItem[]> {
  const { data, error } = await stagingFrom("report_documents")
    .select(
      "id, title, report_type, report_date, file_mime, status, summary, user_decision, created_at",
    )
    .order("report_date", { ascending: false })
    .limit(100)
    .list();

  if (error) return [];
  return ((data ?? []) as ReportDocumentRow[]).map(mapReportDocument);
}

export async function fetchMedicalReports(): Promise<MedicalReportRow[]> {
  const { data, error } = await stagingFrom("medical_reports")
    .select("id, created_at, window_from, window_to, file_path")
    .order("created_at", { ascending: false })
    .limit(50)
    .list();

  if (error) return [];
  return (data ?? []) as MedicalReportRow[];
}
