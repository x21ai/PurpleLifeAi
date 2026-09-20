import { useState } from "react";
import { CalendarDays, Check, ChevronDown, Download, FileHeart, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { SharingRings } from "@/components/pages/pilot/components/mobile-graphics";

type SharedMode = "friend" | "public-report";

/**
 * @ployComponent
 * @ployComponentId purplelife-shared-health-page
 * @ployComponentType page
 * @ployComponentDescription Read-only friend and public report views with explicit scope and privacy boundaries.
 * @ployComponentTags purplelife sharing caregiver report privacy
 * @ployComponentStatus experimental
 */
export function SharedHealthPage({ id, mode }: { id: string; mode: SharedMode }) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [downloaded, setDownloaded] = useState(false);
  const isPublic = mode === "public-report";

  return (
    <PilotAppShell active="browse" showTabs={!isPublic} landscape="focused">
      <DetailHeader title={isPublic ? "Shared report" : "Friend health"} backHref={isPublic ? "/" : "/care"} />
      <section className="px-5 pt-1 text-center">
        <SharingRings className="mx-auto w-full max-w-[340px]" />
        <p className="-mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Read-only access</p>
        <h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">{isPublic ? "A health summary was shared with you." : "Review what your friend chose to share."}</h1>
        <p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">You cannot change journal entries, medication, sharing settings, or account information from this page.</p>
      </section>

      <section className="mt-7 px-5">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
          <button type="button" onClick={() => setDetailsOpen((value) => !value)} className="flex w-full items-center gap-3.5 px-4 py-4 text-left">
            <span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent"><ShieldCheck size={20} /></span>
            <span className="flex-1"><span className="block text-[15px] font-semibold">Shared details</span><span className="mt-1 block text-[12px] text-purplelife-muted">Scope selected by the account owner</span></span>
            <ChevronDown size={18} className={`text-purplelife-muted transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
          </button>
          {detailsOpen && <div className="border-t border-purplelife-line">
            <div className="flex gap-3 px-5 py-4"><CalendarDays size={19} className="shrink-0 text-purplelife-accent" /><span><span className="block text-[13px] font-semibold">Date window</span><span className="mt-1 block text-[12px] text-purplelife-muted">Only the dates included by the person sharing</span></span></div>
            <div className="flex gap-3 border-t border-purplelife-line px-5 py-4"><FileHeart size={19} className="shrink-0 text-purplelife-coral" /><span><span className="block text-[13px] font-semibold">Health information</span><span className="mt-1 block text-[12px] text-purplelife-muted">Selected symptoms, medication entries, sleep, and notes</span></span></div>
            <div className="flex gap-3 border-t border-purplelife-line px-5 py-4"><UserRound size={19} className="shrink-0 text-purplelife-accent" /><span><span className="block text-[13px] font-semibold">Viewer</span><span className="mt-1 block text-[12px] text-purplelife-muted">Link reference {id}</span></span></div>
          </div>}
        </div>
      </section>

      {isPublic && <section className="mt-5 px-5"><button type="button" onClick={() => setDownloaded(true)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white">{downloaded ? <Check size={18} /> : <Download size={18} />}{downloaded ? "Download prepared" : "Download shared PDF"}</button><p className="mt-3 text-center text-[12px] text-purplelife-muted">This prototype does not download a production health record.</p></section>}

      <section className="mt-5 px-5"><p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted"><LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />Access is read-only, limited to what was selected, and can be removed by the person who shared it.</p></section>
    </PilotAppShell>
  );
}
