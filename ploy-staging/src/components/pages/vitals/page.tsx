import { Activity, ChevronRight, Droplets, HeartPulse, Plus, Thermometer, Wind } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { VitalWave } from "@/components/pages/pilot/components/mobile-graphics";

const groups = [
  { label: "Heart", detail: "Heart rate, variability, and blood pressure", slug: "resting-heart-rate", icon: HeartPulse, color: "bg-purplelife-pink/15 text-purplelife-pink" },
  { label: "Breathing", detail: "Respiratory rate and blood oxygen", slug: "respiratory-rate", icon: Wind, color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { label: "Temperature", detail: "Manual body temperature records", slug: "temperature", icon: Thermometer, color: "bg-purplelife-peach text-purplelife-coral" },
  { label: "Activity", detail: "Steps and movement totals", slug: "steps", icon: Activity, color: "bg-purplelife-mint/20 text-purplelife-mint" },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-vitals-page
 * @ployComponentType page
 * @ployComponentDescription Vitals overview that routes to metric families without displaying invented health readings.
 * @ployComponentTags purplelife vitals measurements
 * @ployComponentStatus experimental
 */
export function VitalsPage() {
  return <PilotAppShell active="browse" landscape="insight"><DetailHeader title="Vitals" backHref="/my-health" action={<a href="/capture" aria-label="Add a reading" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></a>} /><section className="px-5 pt-1 text-center"><VitalWave className="mx-auto w-full max-w-[355px]" /><p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Recorded readings</p><h1 className="mx-auto mt-2 max-w-[380px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Review a body system, then its source.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">This overview groups readings without guessing what a change means.</p></section><PilotLandscapeStack><section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{groups.map(({ label, detail, slug, icon: Icon, color }) => <a key={label} href={`/biometrics/${slug}`} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0"><span className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${color}`}><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{label}</span><span className="mt-1 block text-[12px] text-purplelife-muted">{detail}</span></span><ChevronRight size={18} className="text-purplelife-muted" /></a>)}</div></section><section className="mt-5 px-5"><a href="/biometrics" className="flex items-center gap-3 rounded-[22px] bg-purplelife-tint p-4"><Droplets size={20} className="text-purplelife-accent" /><span className="flex-1 text-[13px] font-semibold">Browse every measurement</span><ChevronRight size={18} /></a></section><PilotContextPanel eyebrow="Source first" title="A reading keeps its context." body="Open a body system to review when a value was recorded, where it came from, and what else you noted that day." items={["Manual entry", "Connected source", "Journal date"]} /></PilotLandscapeStack></PilotAppShell>;
}
