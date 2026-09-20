import { ChevronRight, Dna, HeartPulse, MoonStar, Pill, ShieldCheck, Sparkles } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { WellbeingBloom } from "@/components/pages/pilot/components/mobile-graphics";

const healthAreas = [
  { label: "Journal patterns", detail: "Review details that appeared together", href: "/insights", icon: Sparkles, color: "bg-purplelife-pink/15 text-purplelife-pink" },
  { label: "Medication", detail: "Schedule and dose history", href: "/meds", icon: Pill, color: "bg-purplelife-mint/20 text-purplelife-mint" },
  { label: "Sleep", detail: "Duration, timing, and notes", href: "/sleep", icon: MoonStar, color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
  { label: "Measurements", detail: "Manual and connected readings", href: "/biometrics", icon: HeartPulse, color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { label: "DNA sources", detail: "Optional connections and consent", href: "/my-health-dna", icon: Dna, color: "bg-purplelife-coral/15 text-purplelife-coral" },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-my-health-page
 * @ployComponentType page
 * @ployComponentDescription PurpleLife health hub organized around journal patterns, medication, sleep, measurements, and optional DNA sources.
 * @ployComponentTags purplelife health hub journal
 * @ployComponentStatus experimental
 */
export function MyHealthPage() {
  return <PilotAppShell active="browse" landscape="insight"><DetailHeader title="My health" backHref="/browse" /><section className="px-5 pt-1 text-center"><WellbeingBloom className="mx-auto -mb-4 w-full max-w-[330px]" headline="Journal" detail="Private by default" /><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Your private map</p><h1 className="mx-auto mt-2 max-w-[380px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Open the part of your health story you need.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">PurpleLife keeps journal entries, schedules, and measurements connected without turning them into a diagnosis.</p></section><PilotLandscapeStack><section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{healthAreas.map(({ label, detail, href, icon: Icon, color }) => <a key={label} href={href} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0"><span className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${color}`}><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{label}</span><span className="mt-1 block text-[12px] text-purplelife-muted">{detail}</span></span><ChevronRight size={18} className="text-purplelife-muted" /></a>)}</div></section><section className="mt-5 px-5"><a href="/risk" className="flex items-center gap-4 rounded-[24px] bg-purplelife-tint p-4"><ShieldCheck size={22} className="text-purplelife-accent" /><span className="flex-1"><span className="block text-[14px] font-semibold">Understand health context</span><span className="mt-1 block text-[12px] text-purplelife-muted">What PurpleLife observations can and cannot tell you.</span></span><ChevronRight size={18} /></a></section><PilotContextPanel eyebrow="Connected by source" title="Follow the detail, not a score." body="Each area keeps its own entries, dates, and sources visible so you can review context without collapsing your health into one number." items={["Journal context", "Recorded dates", "Visible sources"]} /></PilotLandscapeStack></PilotAppShell>;
}
