import { useState } from "react";
import { ChevronRight, Clock3, Link2, MoonStar, NotebookPen, Sparkles } from "lucide-react";
import { PilotAppShell, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";

const sleepSignals = [
  { label: "Bedtime", detail: "Appears after you record when sleep began.", position: "left-[8%] top-[54%]", color: "bg-purplelife-indigo" },
  { label: "Wake time", detail: "Connects the end of a sleep entry to its source.", position: "left-[26%] top-[41%]", color: "bg-purplelife-pink" },
  { label: "Restfulness", detail: "Shows the feeling you chose in your journal note.", position: "left-[44%] top-[24%]", color: "bg-purplelife-yellow" },
  { label: "Sleep note", detail: "Keeps your own context beside timing details.", position: "left-[59%] top-[42%]", color: "bg-purplelife-mint" },
  { label: "Source", detail: "Identifies whether an entry was manual or connected.", position: "left-[76%] top-[19%]", color: "bg-purplelife-coral" },
] as const;

function SleepInsightGraphic() {
  const [selectedSignal, setSelectedSignal] = useState(0);
  const selected = sleepSignals[selectedSignal];

  return (
    <div className="purplelife-sleep-graphic relative mx-auto w-full max-w-[390px] overflow-hidden rounded-[30px] bg-purplelife-tint" role="group" aria-label="Explore the details a sleep entry can contain">
      <svg viewBox="0 0 360 250" className="purplelife-sleep-graphic-canvas block w-full" aria-hidden="true">
        <defs>
          <linearGradient id="sleep-flow" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#6969ea" /><stop offset="0.5" stopColor="#b85cbe" /><stop offset="1" stopColor="#f07c73" /></linearGradient>
          <radialGradient id="sleep-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#ffffff" stopOpacity="0.9" /><stop offset="1" stopColor="#d9c9fb" stopOpacity="0" /></radialGradient>
          <filter id="sleep-orb-shadow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#6b55b5" floodOpacity="0.2" /></filter>
        </defs>
        <circle cx="184" cy="117" r="106" fill="url(#sleep-glow)" className="purplelife-sleep-ambient" />
        <path d="M38 154 C78 119 111 133 145 91 S211 51 298 69" fill="none" stroke="url(#sleep-flow)" strokeWidth="3" strokeLinecap="round" className="purplelife-sleep-flow" />
        <path d="M38 154 C91 183 141 157 174 119 S238 94 298 69" fill="none" className="purplelife-sleep-secondary-flow stroke-purplelife-blue" strokeWidth="2" strokeDasharray="5 9" opacity="0.48" />
        <g filter="url(#sleep-orb-shadow)" opacity="0.32"><circle cx="45" cy="158" r="20" className="fill-purplelife-indigo" /><circle cx="111" cy="126" r="24" className="fill-purplelife-pink" /><circle cx="176" cy="82" r="18" className="fill-purplelife-yellow" /><circle cx="229" cy="127" r="21" className="fill-purplelife-mint" /><circle cx="291" cy="68" r="25" className="fill-purplelife-coral" /></g>
      </svg>
      <div className="absolute inset-0" aria-hidden="true" />
      {sleepSignals.map((signal, index) => <button key={signal.label} type="button" onClick={() => setSelectedSignal(index)} aria-pressed={selectedSignal === index} aria-label={`Show ${signal.label.toLowerCase()} context`} className={`purplelife-sleep-signal absolute ${signal.position} grid size-11 place-items-center rounded-full ${signal.color} shadow-lg ring-4 ring-white/70 transition-transform ${selectedSignal === index ? "is-selected" : ""}`}><span className="size-2 rounded-full bg-white/90" /></button>)}
      <div className="purplelife-sleep-insight absolute inset-x-4 bottom-4 rounded-[20px] border border-white/70 bg-white/80 px-4 py-3 text-left shadow-sm backdrop-blur-xl" aria-live="polite">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-purplelife-accent">Explore the graphic</span>
        <span className="mt-1 block text-[14px] font-semibold tracking-[-0.015em]">{selected.label}</span>
        <span className="mt-0.5 block text-[12px] leading-[1.4] text-purplelife-muted">{selected.detail}</span>
      </div>
    </div>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-sleep-page
 * @ployComponentType page
 * @ployComponentDescription Sleep review page with range controls, source-aware empty state, and journal actions.
 * @ployComponentTags purplelife sleep journal patterns
 * @ployComponentStatus experimental
 */
export function SleepPage() {
  const [range, setRange] = useState("Week");
  return <PilotAppShell active="browse" landscape="insight"><DetailHeader title="Sleep" backHref="/my-health" className="purplelife-sleep-header" titleClassName="purplelife-sleep-title" /><section className="px-5 pt-1 text-center"><SleepInsightGraphic /><p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Rest and routine</p><h1 className="mx-auto mt-2 max-w-[370px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Review timing beside the notes you made.</h1><p className="mx-auto mt-3 max-w-[370px] text-[16px] font-medium leading-[1.5] text-purplelife-muted">Sleep records can add context to your journal. PurpleLife does not diagnose sleep conditions.</p></section><PilotLandscapeStack><section className="mt-7 px-5"><div className="grid grid-cols-3 rounded-[18px] bg-purplelife-rail p-1">{["Week", "Month", "Year"].map((item) => <button key={item} type="button" onClick={() => setRange(item)} className={`min-h-10 rounded-[14px] text-[12px] font-semibold ${range === item ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>{item}</button>)}</div><div className="mt-4 rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line"><MoonStar size={26} className="mx-auto text-purplelife-accent" /><p className="mt-3 text-[16px] font-semibold tracking-[-0.015em]">No {range.toLowerCase()} sleep records loaded</p><p className="mx-auto mt-2 max-w-[420px] text-[14px] font-medium leading-[1.5] text-purplelife-muted">Manual entries and connected sleep data will appear here with their source.</p></div></section><section className="purplelife-sleep-actions mt-5 px-5"><div className="purplelife-sleep-action-grid overflow-hidden rounded-[24px] bg-purplelife-tint"><a href="/journal/new" className="purplelife-sleep-action-row flex items-center gap-3 border-b border-purplelife-accent/10 p-4"><span className="purplelife-sleep-action-icon grid size-10 shrink-0 place-items-center rounded-full bg-white/80"><NotebookPen size={19} className="text-purplelife-accent" /></span><span className="flex-1"><span className="block text-[16px] font-semibold tracking-[-0.015em]">Add a sleep note</span><span className="mt-1 block text-[14px] font-medium leading-[1.4] text-purplelife-muted">Bedtime, wake time, and how rest felt</span></span><ChevronRight size={18} className="shrink-0 text-purplelife-muted" /></a><a href="/insights" className="purplelife-sleep-action-row flex items-center gap-3 p-4"><span className="purplelife-sleep-action-icon grid size-10 shrink-0 place-items-center rounded-full bg-white/80"><Sparkles size={19} className="text-purplelife-accent" /></span><span className="flex-1"><span className="block text-[16px] font-semibold tracking-[-0.015em]">Review journal patterns</span><span className="mt-1 block text-[14px] font-medium leading-[1.4] text-purplelife-muted">Look at details that appeared together</span></span><ChevronRight size={18} className="shrink-0 text-purplelife-muted" /></a></div></section><section className="purplelife-sleep-context px-5"><div className="rounded-[26px] border border-purplelife-line bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-purplelife-accent">When records arrive</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.025em]">See what shaped the night.</h2></div><MoonStar size={22} className="mt-1 shrink-0 text-purplelife-accent" /></div><p className="mt-2 max-w-[480px] text-[15px] font-medium leading-[1.5] text-purplelife-muted">PurpleLife keeps timing, your own words, and the source visible together. Select the points in the graphic to preview that structure.</p><div className="mt-4 grid grid-cols-3 gap-2"><span className="rounded-[16px] bg-purplelife-tint p-3"><Clock3 size={17} className="text-purplelife-accent" /><span className="mt-2 block text-[12px] font-semibold">Timing</span></span><span className="rounded-[16px] bg-purplelife-tint p-3"><NotebookPen size={17} className="text-purplelife-accent" /><span className="mt-2 block text-[12px] font-semibold">Your note</span></span><span className="rounded-[16px] bg-purplelife-tint p-3"><Link2 size={17} className="text-purplelife-accent" /><span className="mt-2 block text-[12px] font-semibold">Source</span></span></div></div></section></PilotLandscapeStack></PilotAppShell>;
}
