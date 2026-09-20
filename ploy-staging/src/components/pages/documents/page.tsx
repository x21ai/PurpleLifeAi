import { useState } from "react";
import { Archive, CalendarDays, Check, ChevronRight, FileImage, FileText, FolderOpen, LockKeyhole, Search, X } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { JournalRibbon } from "@/components/pages/pilot/components/mobile-graphics";

type DocumentKind = "PDF" | "JPEG";
type DocumentRecord = {
  id: string;
  name: string;
  kind: DocumentKind;
  size: string;
  date: string;
  archived: boolean;
  description: string;
};

const SAMPLE_DOCUMENTS: DocumentRecord[] = [
  { id: "visit-summary", name: "Visit summary.pdf", kind: "PDF", size: "428 KB", date: "September 12, 2026", archived: false, description: "Sample clinician visit summary with source and review metadata." },
  { id: "lab-image", name: "Lab image.jpg", kind: "JPEG", size: "1.8 MB", date: "September 8, 2026", archived: false, description: "Sample image record for reviewing a photographed document." },
  { id: "medication-list", name: "Medication list.pdf", kind: "PDF", size: "312 KB", date: "August 24, 2026", archived: true, description: "Sample archived medication document kept separate from current files." },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-documents-page
 * @ployComponentType page
 * @ployComponentDescription Documents prototype with empty and populated PDF and JPEG lists, archive filtering, file detail, and local open-preview states.
 * @ployComponentTags purplelife documents reports files prototype
 * @ployComponentStatus stable
 */
export function DocumentsPage() {
  const [mode, setMode] = useState<"sample" | "empty">("sample");
  const [archived, setArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DocumentRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const visibleDocuments = mode === "empty" ? [] : SAMPLE_DOCUMENTS.filter((document) => document.archived === archived && document.name.toLowerCase().includes(query.toLowerCase()));

  function closeDocument() {
    setSelected(null);
    setPreviewOpen(false);
  }

  return (
    <PilotAppShell active="browse" landscape="insight">
      <DetailHeader title="Documents" backHref="/reports" />
      <section className="documents-page__hero px-5 pt-1 text-center">
        <JournalRibbon className="mx-auto w-full max-w-[340px]" />
        <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Reports and files</p>
        <h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Keep source documents organized.</h1>
        <p className="mx-auto mt-3 max-w-[360px] text-[15px] leading-[1.45] text-purplelife-muted">Review current and archived files separately from the summaries you choose to share.</p>
      </section>

      <PilotLandscapeStack>
        <section className="documents-page__controls mt-7 px-5">
          <div className="rounded-[26px] bg-white p-3 shadow-sm ring-1 ring-purplelife-line">
            <div className="flex rounded-[18px] bg-purplelife-rail p-1" aria-label="Document preview state">
              <button type="button" onClick={() => setMode("sample")} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "sample" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Sample files</button>
              <button type="button" onClick={() => setMode("empty")} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "empty" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Empty state</button>
            </div>
            <div className="mt-3 flex rounded-[18px] bg-purplelife-tint p-1">
              <button type="button" onClick={() => setArchived(false)} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${!archived ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Current</button>
              <button type="button" onClick={() => setArchived(true)} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${archived ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Archived</button>
            </div>
            <label className="mt-3 flex h-11 items-center gap-2 rounded-[16px] bg-purplelife-canvas px-3"><Search size={17} className="text-purplelife-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a document" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-purplelife-muted/60" /></label>
          </div>
        </section>

        <section className="documents-page__list mt-4 px-5">
          {visibleDocuments.length === 0 ? (
            <div className="rounded-[28px] bg-white p-7 text-center shadow-sm ring-1 ring-purplelife-line">
              <FolderOpen size={28} className="mx-auto text-purplelife-accent" />
              <h2 className="mt-3 text-[16px] font-semibold">No {archived ? "archived" : "current"} documents</h2>
              <p className="mx-auto mt-2 max-w-[290px] text-[12px] leading-[1.5] text-purplelife-muted">This is the empty prototype state. Production files would appear only after they were added and reviewed.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
              {visibleDocuments.map((document) => {
                const Icon = document.kind === "PDF" ? FileText : FileImage;
                return (
                  <button key={document.id} type="button" onClick={() => { setSelected(document); setPreviewOpen(false); }} className="flex w-full items-center gap-3.5 border-b border-purplelife-line px-4 py-4 text-left last:border-b-0 active:bg-purplelife-tint">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-[16px] ${document.kind === "PDF" ? "bg-purplelife-pink/15 text-purplelife-pink" : "bg-purplelife-blue/15 text-purplelife-blue"}`}><Icon size={21} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{document.name}</span><span className="mt-1 block text-[11px] text-purplelife-muted">{document.kind} · {document.size} · {document.date}</span></span>
                    <ChevronRight size={18} className="text-purplelife-muted" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="documents-page__notice mt-5 px-5">
          <p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted"><LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />This visual prototype does not upload, download, analyze, or open a production file.</p>
        </section>

        <PilotContextPanel eyebrow="Source before summary" title="Keep the original file beside anything PurpleLife extracts." body="A production document record should show file type, date, archive state, and review status before it contributes to a report." items={["PDF", "JPEG", "Date", "Review status"]} />
      </PilotLandscapeStack>

      {selected && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={closeDocument}>
          <div role="dialog" aria-modal="true" aria-label={`${selected.name} details`} onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[420px] animate-in rounded-[34px] p-5 slide-in-from-bottom-6 duration-300">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-purplelife-accent">{previewOpen ? "Open preview" : "File details"}</p><h2 className="mt-2 text-[23px] font-semibold tracking-[-0.035em]">{selected.name}</h2></div><button type="button" onClick={closeDocument} aria-label="Close document" className="grid size-9 shrink-0 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button></div>
            {previewOpen ? (
              <div className="mt-5 rounded-[24px] bg-white p-5 ring-1 ring-purplelife-line">
                <div className="grid min-h-52 place-items-center rounded-[18px] bg-purplelife-canvas p-5 text-center"><div><FileText size={34} className="mx-auto text-purplelife-accent" /><p className="mt-3 text-[14px] font-semibold">Static {selected.kind} preview</p><p className="mt-2 text-[12px] leading-[1.45] text-purplelife-muted">Document content is intentionally omitted. No local or production file was opened.</p></div></div>
                <button type="button" onClick={() => setPreviewOpen(false)} className="mt-4 min-h-11 w-full rounded-[16px] bg-purplelife-tint text-[12px] font-semibold text-purplelife-accent">Back to details</button>
              </div>
            ) : (
              <><p className="mt-4 text-[13px] leading-[1.5] text-purplelife-muted">{selected.description}</p><div className="mt-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-purplelife-line"><p className="flex items-center gap-3 border-b border-purplelife-line px-4 py-3 text-[12px]"><CalendarDays size={17} className="text-purplelife-accent" /><span className="flex-1 text-purplelife-muted">Added</span><span className="font-semibold">{selected.date}</span></p><p className="flex items-center gap-3 px-4 py-3 text-[12px]"><Archive size={17} className="text-purplelife-accent" /><span className="flex-1 text-purplelife-muted">State</span><span className="font-semibold">{selected.archived ? "Archived" : "Current"}</span></p></div><button type="button" onClick={() => setPreviewOpen(true)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[13px] font-semibold text-white"><Check size={18} />Open static preview</button></>
            )}
          </div>
        </div>
      )}
    </PilotAppShell>
  );
}
