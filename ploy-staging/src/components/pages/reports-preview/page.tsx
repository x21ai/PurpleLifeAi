import { useState, type ReactNode } from "react";
import { CalendarDays, Check, ChevronRight, FileHeart, FileText, FileUp, LockKeyhole, Plus, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { PilotAppShell, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { JournalRibbon, TrendConstellation } from "@/components/pages/pilot/components/mobile-graphics";

type ReportArea = "Reports" | "Create report" | "Metrics" | "Documents" | "Medical history";

function Row({ icon, title, detail, href }: { icon: ReactNode; title: string; detail: string; href?: string }) {
  const content = <><span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent">{icon}</span><span className="min-w-0 flex-1 text-left"><span className="block text-[14px] font-semibold">{title}</span><span className="mt-1 block text-[12px] leading-[1.4] text-purplelife-muted">{detail}</span></span>{href && <ChevronRight size={18} className="text-purplelife-muted" />}</>;
  return href ? <a href={href} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0">{content}</a> : <div className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0">{content}</div>;
}

function ReportsHome() {
  const [mode, setMode] = useState<"empty" | "sample">("empty");
  return <><div className="mb-4 flex rounded-[18px] bg-purplelife-rail p-1"><button type="button" onClick={() => setMode("empty")} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "empty" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Empty state</button><button type="button" onClick={() => setMode("sample")} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "sample" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Sample reports</button></div><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><Row icon={<Plus size={20} />} title="Create a report" detail="Choose dates and details before sharing." href="/reports/new" />{mode === "empty" ? <Row icon={<FileText size={20} />} title="No prepared reports" detail="Reports you prepare and review will appear here." /> : <><Row icon={<FileHeart size={20} />} title="Appointment summary · sample" detail="September 12 · Private draft" href="/report/appointment-summary" /><Row icon={<CalendarDays size={20} />} title="90-day journal summary · sample" detail="August 24 · Read-only link inactive" href="/report/journal-summary" /></>}<Row icon={<FileText size={20} />} title="Source documents" detail="Review current and archived PDF or JPEG files." href="/documents" /><Row icon={<ShieldCheck size={20} />} title="Sharing controls" detail="Reports stay private until you choose a read-only link." href="/sharing" /></div></>;
}

function CreateReport() {
  const [files, setFiles] = useState<string[]>([]);
  const [prepared, setPrepared] = useState(false);
  return <><label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-purplelife-accent/35 bg-white p-6 text-center shadow-sm"><FileUp size={28} className="text-purplelife-accent" /><span className="mt-3 text-[14px] font-semibold">Choose report files</span><span className="mt-1 text-[12px] text-purplelife-muted">PDF, JPG, PNG, HEIC, or WEBP · review before upload</span><input type="file" multiple className="sr-only" onChange={(event) => { setFiles(Array.from(event.target.files ?? []).map((file) => file.name)); setPrepared(false); }} /></label>{files.length > 0 && <div className="mt-4 overflow-hidden rounded-[24px] bg-white ring-1 ring-purplelife-line">{files.map((file) => <div key={file} className="flex items-center gap-3 border-b border-purplelife-line px-4 py-3 last:border-b-0"><FileText size={18} className="text-purplelife-accent" /><span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{file}</span><button type="button" aria-label={`Remove ${file}`} onClick={() => setFiles((current) => current.filter((name) => name !== file))}><X size={17} className="text-purplelife-muted" /></button></div>)}</div>}<button type="button" disabled={files.length === 0} onClick={() => setPrepared(true)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white disabled:bg-purplelife-rail disabled:text-purplelife-muted"><Sparkles size={18} />{prepared ? "Review prepared" : "Prepare extraction review"}</button>{prepared && <div className="mt-4 rounded-[22px] bg-purplelife-tint p-4"><p className="text-[12px] leading-[1.5] text-purplelife-muted">The production Cloudflare workflow reads files only after confirmation. This prototype does not upload them.</p><a href="/reports/journal-summary" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-white text-[13px] font-semibold text-purplelife-accent ring-1 ring-purplelife-line">Open report review<ChevronRight size={17} /></a></div>}</>;
}

function Metrics() {
  const [query, setQuery] = useState("");
  const metrics = ["Resting heart rate", "Heart rate variability", "Sleep total", "Blood oxygen"];
  return <><label className="flex h-12 items-center gap-2 rounded-[18px] bg-white px-4 ring-1 ring-purplelife-line"><Search size={18} className="text-purplelife-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a metric" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-purplelife-muted/60" /></label><div className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{metrics.filter((metric) => metric.toLowerCase().includes(query.toLowerCase())).map((metric) => <Row key={metric} icon={<TrendConstellation className="size-9" />} title={metric} detail="Open its recorded history and source context." href={`/reports/trends/${metric.toLowerCase().replaceAll(" ", "-")}`} />)}</div></>;
}

function Documents() {
  const [showArchived, setShowArchived] = useState(false);
  return <><div className="flex rounded-[18px] bg-purplelife-rail p-1"><button type="button" onClick={() => setShowArchived(false)} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${!showArchived ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Current</button><button type="button" onClick={() => setShowArchived(true)} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${showArchived ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Archived</button></div><div className="mt-4 rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line"><FileText size={25} className="mx-auto text-purplelife-accent" /><p className="mt-3 text-[14px] font-semibold">No {showArchived ? "archived" : "current"} documents loaded</p><p className="mt-2 text-[12px] leading-[1.45] text-purplelife-muted">Cloudflare document records will appear here after a report is added and reviewed.</p></div></>;
}

function MedicalHistory() {
  const [range, setRange] = useState("90 days");
  const [ready, setReady] = useState(false);
  return <><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><label className="text-[12px] font-semibold text-purplelife-muted">History window<select value={range} onChange={(event) => { setRange(event.target.value); setReady(false); }} className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 text-[14px] outline-none"><option>30 days</option><option>90 days</option><option>1 year</option></select></label><div className="mt-5 overflow-hidden rounded-[20px] bg-purplelife-tint"><Row icon={<CalendarDays size={19} />} title={range} detail="Journal, medication, sleep, and selected report details" /><Row icon={<LockKeyhole size={19} />} title="Private draft" detail="Review every section before creating a link" /></div><button type="button" onClick={() => setReady(true)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white"><Check size={18} />{ready ? "Draft ready to review" : "Prepare history draft"}</button></div>{ready && <a href="/reports/journal-summary" className="mt-4 flex items-center gap-3 rounded-[22px] bg-purplelife-peach p-4"><FileHeart size={20} className="text-purplelife-coral" /><span className="flex-1 text-[13px] font-semibold">Open the report review</span><ChevronRight size={18} /></a>}</>;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-reports-preview-page
 * @ployComponentType page
 * @ployComponentDescription Route-specific report workspace with empty and populated report states, document access, creation, review, and sharing previews.
 * @ployComponentTags purplelife reports sharing health
 * @ployComponentStatus stable
 */
export function ReportsPreviewPage({ area = "Reports" }: { area?: ReportArea }) {
  const isMetrics = area === "Metrics";
  const headings: Record<ReportArea, [string, string]> = {
    Reports: ["Your report workspace.", "Prepare, review, and share selected health information without opening your private journal."],
    "Create report": ["Add a report for review.", "Choose source files, inspect what PurpleLife finds, then decide what should be saved."],
    Metrics: ["Review a metric across reports.", "Trace each recorded value back to its source document and date."],
    Documents: ["Keep source documents organized.", "Current and archived files stay separate from the summaries you choose to share."],
    "Medical history": ["Prepare a careful medical history.", "Choose a time window and review the draft before creating a read-only link."],
  };
  return <PilotAppShell active="browse" landscape="insight"><DetailHeader title="Reports" backHref="/sharing" action={<a href="/reports/new" aria-label="Create report" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></a>} /><section className="px-5 pt-1 text-center">{isMetrics ? <TrendConstellation className="mx-auto w-full max-w-[340px]" /> : <JournalRibbon className="mx-auto w-full max-w-[340px]" />}<p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">{area}</p><h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">{headings[area][0]}</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">{headings[area][1]}</p></section><PilotLandscapeStack><section className="mt-7 px-5">{area === "Reports" && <ReportsHome />}{area === "Create report" && <CreateReport />}{area === "Metrics" && <Metrics />}{area === "Documents" && <Documents />}{area === "Medical history" && <MedicalHistory />}</section><section className="mt-5 px-5"><p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted"><LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />Nothing is uploaded, generated, downloaded, or shared from this visual prototype.</p></section></PilotLandscapeStack></PilotAppShell>;
}
