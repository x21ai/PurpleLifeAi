import { useState, type ComponentType } from "react";
import { Camera, Check, ChevronRight, Mic2, MoonStar, NotebookPen, Pill, Sparkles } from "lucide-react";
import { PilotAppShell, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { CaptureHalo } from "@/components/pages/pilot/components/mobile-graphics";

type CaptureChoice = { label: string; detail: string; icon: ComponentType<{ size?: number }>; href: string; color: string };
const choices: CaptureChoice[] = [
  { label: "Symptom", detail: "What you noticed and when", icon: Sparkles, href: "/journal/new", color: "bg-purplelife-pink/15 text-purplelife-pink" },
  { label: "Note", detail: "Something you want to remember", icon: NotebookPen, href: "/journal/new", color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { label: "Photo", detail: "Keep visual context private", icon: Camera, href: "/journal/new", color: "bg-purplelife-peach text-purplelife-coral" },
  { label: "Voice", detail: "Talk now, review before saving", icon: Mic2, href: "/journal/new", color: "bg-purplelife-tint text-purplelife-accent" },
  { label: "Medication", detail: "Scheduled or extra dose", icon: Pill, href: "/meds", color: "bg-purplelife-mint/20 text-purplelife-mint" },
  { label: "Sleep", detail: "Timing and restfulness", icon: MoonStar, href: "/sleep", color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-capture-page
 * @ployComponentType page
 * @ployComponentDescription Guided capture launcher with distinct journal, photo, voice, medication, and sleep paths.
 * @ployComponentTags purplelife capture journal mobile
 * @ployComponentStatus experimental
 */
export function CapturePage() {
  const [selected, setSelected] = useState("");
  return <PilotAppShell active="today" landscape="insight"><DetailHeader title="Capture" backHref="/today" /><section className="px-5 pt-1 text-center"><CaptureHalo className="mx-auto w-full max-w-[335px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Add to today</p><h1 className="mx-auto mt-2 max-w-[370px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">What would you like to remember?</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Choose a starting point. You can review and edit before anything reaches your journal.</p></section><PilotLandscapeStack><section className="mt-7 px-5"><div className="grid grid-cols-2 gap-3">{choices.map(({ label, detail, icon: Icon, color }) => <button key={label} type="button" onClick={() => setSelected(label)} className={`rounded-[22px] bg-white p-4 text-left shadow-sm ring-1 ${selected === label ? "ring-2 ring-purplelife-accent" : "ring-purplelife-line"}`}><span className={`grid size-10 place-items-center rounded-[14px] ${color}`}><Icon size={19} /></span><span className="mt-4 block text-[14px] font-semibold">{label}</span><span className="mt-1 block text-[11px] leading-[1.4] text-purplelife-muted">{detail}</span></button>)}</div>{selected && <a href={choices.find((choice) => choice.label === selected)?.href ?? "/journal/new"} className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white"><Check size={18} />Continue with {selected.toLowerCase()}<ChevronRight size={18} /></a>}</section></PilotLandscapeStack></PilotAppShell>;
}
