import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  ChevronRight,
  FileImage,
  FileText,
  FolderOpen,
  LockKeyhole,
  Search,
  X,
} from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { JournalRibbon } from "@/components/pages/pilot/components/mobile-graphics";
import { StagingBanner } from "./staging-banner";
import { isStagingLiveData } from "@/lib/staging/config";
import { ensureStagingSession, stagingSignInRequiredMessage } from "@/lib/staging/session";
import { fetchReportDocuments, type ReportListItem } from "@/lib/staging/reports-data";

type StagingLiveDocumentsPageProps = {
  backHref?: string;
};

/**
 * Report documents list wired to production D1 report_documents.
 */
export function StagingLiveDocumentsPage({ backHref = "/reports" }: StagingLiveDocumentsPageProps) {
  const [documents, setDocuments] = useState<ReportListItem[]>([]);
  const [archived, setArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReportListItem | null>(null);
  const [loading, setLoading] = useState(isStagingLiveData());
  const [sessionOk, setSessionOk] = useState(false);

  useEffect(() => {
    if (!isStagingLiveData()) return;
    let cancelled = false;
    (async () => {
      const ok = await ensureStagingSession();
      if (cancelled) return;
      setSessionOk(ok);
      if (!ok) {
        setLoading(false);
        return;
      }
      try {
        const docs = await fetchReportDocuments();
        if (!cancelled) setDocuments(docs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleDocuments = useMemo(() => {
    const term = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (doc.archived !== archived) return false;
      if (!term) return true;
      return `${doc.title} ${doc.detail} ${doc.summary ?? ""}`.toLowerCase().includes(term);
    });
  }, [documents, archived, query]);

  return (
    <>
      <StagingBanner />
      <PilotAppShell active="browse" landscape="insight">
        <DetailHeader title="Documents" backHref={backHref} />
        <section className="px-5 pt-1 text-center">
          <JournalRibbon className="mx-auto w-full max-w-[340px]" />
          <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">
            Reports and files
          </p>
          <h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">
            Keep source documents organized.
          </h1>
          <p className="mx-auto mt-3 max-w-[360px] text-[15px] leading-[1.45] text-purplelife-muted">
            Keep current and rejected files separate from the summaries you share.
          </p>
        </section>

        {isStagingLiveData() && (
          <p className="mx-5 mt-4 rounded-[14px] bg-purplelife-tint px-3 py-2 text-[12px] font-medium text-purplelife-accent">
            {loading
              ? "Loading your documents…"
              : sessionOk
                ? `Live documents · ${documents.filter((d) => !d.archived).length} current · ${documents.filter((d) => d.archived).length} rejected.`
                : stagingSignInRequiredMessage()}
          </p>
        )}

        <PilotLandscapeStack>
          <section className="mt-7 px-5">
            <div className="rounded-[26px] bg-white p-3 shadow-sm ring-1 ring-purplelife-line">
              <div className="flex rounded-[18px] bg-purplelife-tint p-1">
                <button
                  type="button"
                  onClick={() => setArchived(false)}
                  className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${!archived ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}
                >
                  Current
                </button>
                <button
                  type="button"
                  onClick={() => setArchived(true)}
                  className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${archived ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}
                >
                  Rejected
                </button>
              </div>
              <label className="mt-3 flex h-11 items-center gap-2 rounded-[16px] bg-purplelife-canvas px-3">
                <Search size={17} className="text-purplelife-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find a document"
                  className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-purplelife-muted/60"
                />
              </label>
            </div>
          </section>

          <section className="mt-4 px-5">
            {loading && (
              <div className="rounded-[28px] bg-white p-7 text-center text-[14px] text-purplelife-muted shadow-sm ring-1 ring-purplelife-line">
                Loading documents…
              </div>
            )}
            {!loading && visibleDocuments.length === 0 && (
              <div className="rounded-[28px] bg-white p-7 text-center shadow-sm ring-1 ring-purplelife-line">
                <FolderOpen size={28} className="mx-auto text-purplelife-accent" />
                <h2 className="mt-3 text-[16px] font-semibold">
                  No {archived ? "rejected" : "current"} documents
                </h2>
                <p className="mx-auto mt-2 max-w-[290px] text-[12px] leading-[1.5] text-purplelife-muted">
                  {archived
                    ? "Rejected report files appear here."
                    : "Uploaded report files appear here after processing."}
                </p>
              </div>
            )}
            {visibleDocuments.length > 0 && (
              <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
                {visibleDocuments.map((document) => {
                  const Icon = document.kind === "PDF" ? FileText : FileImage;
                  return (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => setSelected(document)}
                      className="flex w-full items-center gap-3.5 border-b border-purplelife-line px-4 py-4 text-left last:border-b-0 active:bg-purplelife-tint"
                    >
                      <span
                        className={`grid size-12 shrink-0 place-items-center rounded-[16px] ${
                          document.kind === "PDF"
                            ? "bg-purplelife-pink/15 text-purplelife-pink"
                            : "bg-purplelife-blue/15 text-purplelife-blue"
                        }`}
                      >
                        <Icon size={21} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">{document.title}</span>
                        <span className="mt-1 block text-[11px] text-purplelife-muted">
                          {document.kind} · {document.date} · {document.status}
                        </span>
                      </span>
                      <ChevronRight size={18} className="text-purplelife-muted" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-5 px-5">
            <p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted">
              <LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />
              Document details stay private until you choose to include them in a report.
            </p>
          </section>

          <PilotContextPanel
            eyebrow="Source before summary"
            title="Keep the original file beside anything PurpleLife extracts."
            body="Each document shows its type, date, and review status."
            items={["PDF", "JPEG", "Date", "Review status"]}
          />
        </PilotLandscapeStack>

        {selected && (
          <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md"
            role="presentation"
            onMouseDown={() => setSelected(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${selected.title} details`}
              onMouseDown={(event) => event.stopPropagation()}
              className="purplelife-glass-sheet w-full max-w-[420px] animate-in rounded-[34px] p-5 slide-in-from-bottom-6 duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-purplelife-accent">
                    File details
                  </p>
                  <h2 className="mt-2 text-[23px] font-semibold tracking-[-0.035em]">{selected.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close document"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-purplelife-rail"
                >
                  <X size={18} />
                </button>
              </div>
              {selected.summary && (
                <p className="mt-4 text-[13px] leading-[1.5] text-purplelife-muted">{selected.summary}</p>
              )}
              <div className="mt-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-purplelife-line">
                <p className="flex items-center gap-3 border-b border-purplelife-line px-4 py-3 text-[12px]">
                  <CalendarDays size={17} className="text-purplelife-accent" />
                  <span className="flex-1 text-purplelife-muted">Report date</span>
                  <span className="font-semibold">{selected.date}</span>
                </p>
                <p className="flex items-center gap-3 px-4 py-3 text-[12px]">
                  <Archive size={17} className="text-purplelife-accent" />
                  <span className="flex-1 text-purplelife-muted">State</span>
                  <span className="font-semibold">{selected.archived ? "Rejected" : "Current"}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </PilotAppShell>
    </>
  );
}
