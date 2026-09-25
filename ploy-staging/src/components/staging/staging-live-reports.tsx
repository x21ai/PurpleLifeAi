import { useEffect, useState, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  FileHeart,
  FileText,
  LockKeyhole,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { PilotAppShell, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { JournalRibbon } from "@/components/pages/pilot/components/mobile-graphics";
import { StagingBanner } from "./staging-banner";
import { isStagingLiveData } from "@/lib/staging/config";
import { ensureStagingSession, stagingSignInRequiredMessage } from "@/lib/staging/session";
import {
  fetchMedicalReports,
  fetchReportDocuments,
  type ReportListItem,
} from "@/lib/staging/reports-data";

function Row({
  icon,
  title,
  detail,
  href,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[14px] font-semibold">{title}</span>
        <span className="mt-1 block text-[12px] leading-[1.4] text-purplelife-muted">{detail}</span>
      </span>
      {(href || onClick) && <ChevronRight size={18} className="text-purplelife-muted" />}
    </>
  );
  if (href) {
    return (
      <a href={href} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0">
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3.5 border-b border-purplelife-line px-4 py-4 text-left last:border-b-0 active:bg-purplelife-tint"
      >
        {content}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0">
      {content}
    </div>
  );
}

/**
 * Reports workspace wired to production D1 report_documents + medical_reports.
 */
export function StagingLiveReportsPage() {
  const [documents, setDocuments] = useState<ReportListItem[]>([]);
  const [medicalCount, setMedicalCount] = useState(0);
  const [loading, setLoading] = useState(isStagingLiveData());
  const [sessionOk, setSessionOk] = useState(false);
  const [selected, setSelected] = useState<ReportListItem | null>(null);

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
        const [docs, medical] = await Promise.all([fetchReportDocuments(), fetchMedicalReports()]);
        if (!cancelled) {
          setDocuments(docs.filter((d) => !d.archived));
          setMedicalCount(medical.length);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentDocs = documents.slice(0, 8);

  return (
    <>
      <StagingBanner />
      <PilotAppShell active="browse" landscape="insight">
        <DetailHeader
          title="Reports"
          backHref="/sharing"
          action={
            <a
              href="/reports/new"
              aria-label="Create report"
              className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"
            >
              <Plus size={20} />
            </a>
          }
        />
        <section className="px-5 pt-1 text-center">
          <JournalRibbon className="mx-auto w-full max-w-[340px]" />
          <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">
            Reports
          </p>
          <h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">
            Your report workspace.
          </h1>
          <p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">
            Prepare, review, and share only the health information you select.
          </p>
        </section>

        {isStagingLiveData() && (
          <p className="mx-5 mt-4 rounded-[14px] bg-purplelife-tint px-3 py-2 text-[12px] font-medium text-purplelife-accent">
            {loading
              ? "Loading your reports…"
              : sessionOk
                ? `Live reports · ${documents.length} document${documents.length === 1 ? "" : "s"} · ${medicalCount} generated report${medicalCount === 1 ? "" : "s"}.`
                : stagingSignInRequiredMessage()}
          </p>
        )}

        <PilotLandscapeStack>
          <section className="mt-7 px-5">
            <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
              <Row
                icon={<Plus size={20} />}
                title="Create a report"
                detail="Choose dates and details before sharing."
                href="/reports/new"
              />
              {loading && (
                <div className="px-4 py-8 text-center text-[13px] text-purplelife-muted">
                  Loading report documents…
                </div>
              )}
              {!loading && currentDocs.length === 0 && (
                <Row
                  icon={<FileText size={20} />}
                  title="No prepared reports"
                  detail="Reports you prepare will appear here."
                />
              )}
              {currentDocs.map((doc) => (
                <Row
                  key={doc.id}
                  icon={<FileHeart size={20} />}
                  title={doc.title}
                  detail={`${doc.date} · ${doc.detail}`}
                  onClick={() => setSelected(doc)}
                />
              ))}
              <Row
                icon={<FileText size={20} />}
                title="Source documents"
                detail={`${documents.length} current file${documents.length === 1 ? "" : "s"}.`}
                href="/reports/documents"
              />
              <Row
                icon={<ShieldCheck size={20} />}
                title="Sharing controls"
                detail="Reports stay private until you choose a read-only link."
                href="/sharing"
              />
            </div>
          </section>
          <section className="mt-5 px-5">
            <p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted">
              <LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />
              Reports remain private until you deliberately choose what to share.
            </p>
          </section>
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
              aria-label="Report details"
              onMouseDown={(event) => event.stopPropagation()}
              className="purplelife-glass-sheet w-full max-w-[402px] animate-in rounded-[34px] p-6 slide-in-from-bottom-6 duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-1.5 text-[12px] font-medium text-purplelife-muted">
                    <CalendarDays size={14} />
                    {selected.date}
                  </p>
                  <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.035em]">{selected.title}</h2>
                  <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-purplelife-accent">
                    {selected.kind} · {selected.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-purplelife-rail"
                >
                  <X size={18} />
                </button>
              </div>
              {selected.summary && (
                <p className="mt-4 text-[14px] leading-[1.45] text-purplelife-muted">{selected.summary}</p>
              )}
              <a
                href="/reports/documents"
                className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-purplelife-tint text-[13px] font-semibold text-purplelife-accent"
              >
                Open documents list
                <ChevronRight size={17} />
              </a>
            </div>
          </div>
        )}
      </PilotAppShell>
    </>
  );
}
