import { useMemo, useState } from "react";
import { CalendarDays, Check, ChevronRight, Download, FileHeart, FileText, LockKeyhole, Share2, Sparkles } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { JournalRibbon, TrendConstellation } from "@/components/pages/pilot/components/mobile-graphics";

function humanize(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type ReportMode = "report" | "care-report" | "trend";

/**
 * @ployComponent
 * @ployComponentId purplelife-report-detail-page
 * @ployComponentType page
 * @ployComponentDescription Purpose-built report, caregiver report, and metric trend detail states with local-only share and download preparation feedback.
 * @ployComponentTags purplelife reports trends sharing
 * @ployComponentStatus experimental
 */
export function ReportDetailPage({ id, mode, ownerId }: { id: string; mode: ReportMode; ownerId?: string }) {
  const [shared, setShared] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [range, setRange] = useState<"30d" | "90d" | "1y">("30d");
  const label = useMemo(() => humanize(id), [id]);
  const isTrend = mode === "trend";
  const isCare = mode === "care-report";

  return (
    <PilotAppShell active="browse" landscape="insight">
      <DetailHeader title={isTrend ? "Metric trend" : isCare ? "Care report" : "Report"} backHref={isTrend ? "/reports/metrics" : isCare ? `/care/${ownerId ?? "care-preview"}` : "/reports"} />
      <section className="px-5 pt-1 text-center">
        {isTrend ? <TrendConstellation className="mx-auto w-full max-w-[350px]" /> : <JournalRibbon className="mx-auto w-full max-w-[340px]" />}
        <p className="-mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">{isTrend ? "Recorded metric" : isCare ? "Read-only care view" : "Prepared summary"}</p>
        <h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">{label}</h1>
        <p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">{isTrend ? "Review the recorded history and its source without treating a pattern as a medical conclusion." : "Review what is included before downloading or sharing this read-only summary."}</p>
      </section>

      {isTrend && (
        <section className="mt-7 px-5">
          <div className="flex rounded-[18px] bg-purplelife-rail p-1">
            {(["30d", "90d", "1y"] as const).map((option) => <button key={option} type="button" onClick={() => setRange(option)} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold transition-colors ${range === option ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>{option}</button>)}
          </div>
          <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line">
            <div className="flex items-center justify-between"><span><span className="block text-[14px] font-semibold">{range} view</span><span className="mt-1 block text-[12px] text-purplelife-muted">No readings loaded in this prototype</span></span><Sparkles size={20} className="text-purplelife-accent" /></div>
            <div className="mt-6 h-28 rounded-[22px] bg-[linear-gradient(to_bottom,transparent_31%,rgba(116,88,155,.12)_32%,transparent_33%,transparent_65%,rgba(116,88,155,.12)_66%,transparent_67%)] ring-1 ring-purplelife-line" />
          </div>
        </section>
      )}

      {!isTrend && (
        <section className="mt-7 px-5">
          <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
            <div className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4"><CalendarDays size={20} className="text-purplelife-accent" /><span className="flex-1"><span className="block text-[14px] font-semibold">Included dates</span><span className="mt-1 block text-[12px] text-purplelife-muted">Selected when the report was prepared</span></span></div>
            <div className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4"><FileHeart size={20} className="text-purplelife-coral" /><span className="flex-1"><span className="block text-[14px] font-semibold">Included health details</span><span className="mt-1 block text-[12px] text-purplelife-muted">Symptoms, medication, sleep, and chosen notes</span></span></div>
            <div className="flex items-center gap-3.5 px-4 py-4"><LockKeyhole size={20} className="text-purplelife-accent" /><span className="flex-1"><span className="block text-[14px] font-semibold">Access</span><span className="mt-1 block text-[12px] text-purplelife-muted">Read-only and removable by the person who shared it</span></span></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setDownloaded(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-white text-[13px] font-semibold ring-1 ring-purplelife-line">{downloaded ? <Check size={18} /> : <Download size={18} />}{downloaded ? "Download prepared" : "Download"}</button>
            <button type="button" onClick={() => setShared(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[13px] font-semibold text-white">{shared ? <Check size={18} /> : <Share2 size={18} />}{shared ? "Ready to share" : "Share"}</button>
          </div>
          {(downloaded || shared) && <p role="status" className="mt-3 text-center text-[12px] leading-[1.4] text-purplelife-muted">Prepared in this visual preview only. No production file or sharing link was created.</p>}
        </section>
      )}

      <section className="mt-5 px-5">
        <a href={isTrend ? "/reports/metrics" : "/reports/documents"} className="flex items-center gap-3 rounded-[22px] bg-purplelife-tint p-4"><FileText size={20} className="text-purplelife-accent" /><span className="flex-1 text-[13px] font-semibold">{isTrend ? "Review all tracked metrics" : "Review source documents"}</span><ChevronRight size={18} /></a>
      </section>
    </PilotAppShell>
  );
}
