import { useState } from "react";
import { Camera, Check, ChevronRight, MoonStar, NotebookPen, Pill, Plus, Sparkles, X } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { MorningRhythmGraphic, WellbeingBloom } from "../components/mobile-graphics";

const emptyStatusItems = [
  { label: "Sleep", value: "Not recorded", icon: MoonStar, color: "text-purplelife-indigo", href: "/sleep" },
  { label: "Symptoms", value: "No entry", icon: Sparkles, color: "text-purplelife-pink", href: "/insights" },
  { label: "Medication", value: "No entry", icon: Pill, color: "text-purplelife-mint", href: "/meds" },
  { label: "Notes", value: "No notes", icon: NotebookPen, color: "text-purplelife-blue", href: "/journal" },
];

const sampleStatusItems = [
  { label: "Sleep", value: "7 hr 18 min", icon: MoonStar, color: "text-purplelife-indigo", href: "/sleep" },
  { label: "Symptoms", value: "1 check-in", icon: Sparkles, color: "text-purplelife-pink", href: "/insights" },
  { label: "Medication", value: "Recorded", icon: Pill, color: "text-purplelife-mint", href: "/meds" },
  { label: "Notes", value: "2 notes", icon: NotebookPen, color: "text-purplelife-blue", href: "/journal" },
];

const addOptions = [
  { label: "Symptom", icon: Sparkles, color: "bg-purplelife-pink/15 text-purplelife-pink" },
  { label: "Note", icon: NotebookPen, color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { label: "Photo", icon: Camera, color: "bg-purplelife-yellow/20 text-purplelife-coral" },
  { label: "Sleep", icon: MoonStar, color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
  { label: "Medication", icon: Pill, color: "bg-purplelife-mint/20 text-purplelife-mint" },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-pilot-today-page
 * @ployComponentType page
 * @ployComponentDescription Today screen with switchable empty and populated prototype states, compact status capsules, original health graphics, and a focused capture sheet.
 * @ployComponentTags purplelife pilot mobile today prototype-states
 * @ployComponentStatus stable
 */
export function PilotTodayPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [mode, setMode] = useState<"empty" | "sample">("empty");
  const statusItems = mode === "empty" ? emptyStatusItems : sampleStatusItems;

  return (
    <PilotAppShell active="today" landscape="today">
      <header className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <div><p className="text-[13px] font-medium text-purplelife-muted">Your private journal</p><h1 className="mt-0.5 text-[34px] font-semibold leading-none tracking-[-0.045em]">Today</h1></div>
          <button type="button" onClick={() => setAddOpen(true)} aria-label="Add to today" className="purplelife-glass-clear grid size-11 place-items-center rounded-full text-purplelife-accent transition-transform duration-300 active:scale-95"><Plus size={22} strokeWidth={2.3} /></button>
        </div>
        <div className="mt-4 flex rounded-[18px] bg-purplelife-rail p-1" aria-label="Today preview state">
          <button type="button" onClick={() => setMode("empty")} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "empty" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Empty day</button>
          <button type="button" onClick={() => setMode("sample")} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "sample" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Sample day</button>
        </div>
      </header>

      <div className="mt-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
        {statusItems.map(({ label, value, icon: Icon, color, href }) => <a key={label} href={href} className="flex min-w-[128px] snap-start items-center gap-2.5 rounded-[17px] border border-purplelife-line bg-white px-3 py-2.5 text-left shadow-sm"><span className={`grid size-8 place-items-center rounded-full bg-purplelife-rail ${color}`}><Icon size={17} strokeWidth={2} /></span><span><span className="block text-[10px] font-medium text-purplelife-muted">{label}</span><span className="block text-[13px] font-semibold">{value}</span></span></a>)}
      </div>

      <section className="px-5 pt-5 lg:flex lg:flex-col">
        <h2 className="text-[28px] font-semibold tracking-[-0.04em]">For you</h2>
        <div className="mt-4 overflow-hidden rounded-[32px] bg-white px-4 pb-5 pt-1 shadow-sm ring-1 ring-purplelife-line lg:flex lg:flex-1 lg:flex-col lg:px-6 lg:pb-6 lg:pt-5">
          <div className="flex flex-1 items-center justify-center rounded-[26px] bg-purplelife-canvas/70 px-4 pt-2 lg:min-h-[320px] lg:px-6 lg:pt-0"><WellbeingBloom className="mx-auto -mb-2 w-full max-w-[310px]" /></div>
          <div className="px-2 pt-3 lg:px-1 lg:pt-5"><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Today at a glance</p><h3 className="mt-2 text-[27px] font-semibold leading-[1.04] tracking-[-0.04em]">{mode === "empty" ? "Today is ready when you are." : "A few details are taking shape."}</h3><p className="mt-3 text-[15px] leading-[1.4] text-purplelife-muted">{mode === "empty" ? "Add sleep, symptoms, medication, or a note. PurpleLife keeps each detail private until you choose to share it." : "This sample shows how sleep, a symptom, medication, and notes can sit together without implying a diagnosis."}</p></div>
        </div>
      </section>

      <section className="mt-8 px-5 lg:flex lg:flex-col">
        <div className="mb-3 flex items-end justify-between lg:mb-4"><h2 className="text-[28px] font-semibold tracking-[-0.04em]">Patterns over time</h2><a href="/insights" className="text-[13px] font-semibold text-purplelife-accent">View</a></div>
        <a href="/insights" className="block w-full overflow-hidden rounded-[32px] bg-white text-left shadow-sm ring-1 ring-purplelife-line lg:flex lg:flex-1 lg:flex-col lg:p-5"><div className="overflow-hidden rounded-[26px] bg-purplelife-tint p-3 lg:flex lg:min-h-[320px] lg:flex-1 lg:items-center lg:p-4"><MorningRhythmGraphic className="aspect-[16/9] w-full" /></div><div className="p-5 lg:px-1 lg:pb-1 lg:pt-5"><h3 className="text-[21px] font-semibold leading-tight tracking-[-0.03em]">{mode === "empty" ? "Patterns need a little history." : "Shorter sleep appeared beside a morning symptom."}</h3><p className="mt-2 text-[14px] leading-[1.4] text-purplelife-muted">{mode === "empty" ? "Once you add journal details, PurpleLife can surface observations without treating them as diagnoses." : "This is sample context only. Review the source entries before deciding whether it is meaningful."}</p><span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-purplelife-accent">How insights work <ChevronRight size={15} /></span></div></a>
      </section>

      {mode === "sample" && <section className="mt-8 px-5"><h2 className="text-[22px] font-semibold tracking-[-0.035em]">Sample timeline</h2><div className="mt-3 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{["Sleep recorded · 7:12 AM", "Medication recorded · 8:05 AM", "Note added · 10:24 AM"].map((item) => <p key={item} className="flex items-center gap-3 border-b border-purplelife-line px-4 py-4 text-[13px] font-semibold last:border-b-0"><span className="grid size-8 place-items-center rounded-full bg-purplelife-mint/20 text-purplelife-mint"><Check size={16} /></span>{item}</p>)}</div></section>}

      <section className="mt-8 px-5"><h2 className="text-[22px] font-semibold tracking-[-0.035em]">Quick capture</h2><div className="mt-3 grid grid-cols-2 gap-3">{addOptions.slice(0, 4).map(({ label, icon: Icon, color }) => <a key={label} href="/capture" className="flex min-h-[74px] items-center gap-3 rounded-[22px] bg-white px-4 text-left shadow-sm ring-1 ring-purplelife-line"><span className={`grid size-10 place-items-center rounded-[14px] ${color}`}><Icon size={20} /></span><span className="text-[14px] font-semibold">{label}</span></a>)}</div></section>

      {addOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={() => setAddOpen(false)}><div role="dialog" aria-modal="true" aria-label="Add to today" onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[402px] animate-in rounded-[34px] p-4 slide-in-from-bottom-6 duration-300"><div className="flex items-center justify-between px-2 pb-2 pt-1"><div><h2 className="text-[22px] font-semibold tracking-[-0.03em]">Add to Today</h2><p className="mt-1 text-[13px] text-purplelife-muted">Choose one detail.</p></div><button type="button" onClick={() => setAddOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button></div><div className="mt-2 divide-y divide-purplelife-line">{addOptions.map(({ label, icon: Icon, color }) => <button key={label} type="button" onClick={() => { window.location.href = "/capture"; }} className="flex w-full items-center gap-4 rounded-2xl px-2 py-3.5 text-left active:bg-purplelife-tint"><span className={`grid size-11 place-items-center rounded-[15px] ${color}`}><Icon size={21} /></span><span className="flex-1 text-[15px] font-semibold">{label}</span><ChevronRight size={18} className="text-purplelife-muted" /></button>)}</div></div></div>}
    </PilotAppShell>
  );
}
