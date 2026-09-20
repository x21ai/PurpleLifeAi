import { useState } from "react";
import {
  Activity,
  AlertCircle,
  Check,
  ChevronRight,
  Dna,
  HeartPulse,
  Link2,
  LockKeyhole,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Wind,
  X,
} from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { DetailHeader, Toggle } from "../detail/page";
import {
  DnaRibbon,
  MessageBubbles,
  PrivacyShield,
  VitalWave,
  WellbeingBloom,
} from "../components/mobile-graphics";

export type PilotExpandedKind = "health" | "vitals" | "risk" | "dna" | "messages";

type ExpandedPageProps = {
  kind: PilotExpandedKind;
};

const healthAreas = [
  { label: "Sleep", detail: "7 h 45 min last night", icon: Activity, color: "bg-purplelife-indigo/15 text-purplelife-indigo", href: "/sleep" },
  { label: "Medication", detail: "2 of 3 recorded today", icon: HeartPulse, color: "bg-purplelife-mint/20 text-purplelife-mint", href: "/meds" },
  { label: "Vitals", detail: "Latest measurements", icon: Wind, color: "bg-purplelife-blue/15 text-purplelife-blue", href: "/vitals" },
  { label: "Patterns", detail: "Details that appeared together", icon: Sparkles, color: "bg-purplelife-pink/15 text-purplelife-pink", href: "/insights" },
];

function HealthScreen() {
  return (
    <>
      <DetailHeader title="My health" backHref="/browse" />
      <section className="px-5 pt-1 text-center">
        <WellbeingBloom className="mx-auto -mb-4 w-full max-w-[320px]" />
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Your overview</p>
        <h1 className="mx-auto mt-2 max-w-[330px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">What you recorded, in one place.</h1>
        <p className="mx-auto mt-3 max-w-[325px] text-[15px] leading-[1.4] text-purplelife-muted">Review recent details and open the parts of your journal that matter today.</p>
      </section>
      <section className="mt-7 px-5">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
          {healthAreas.map(({ label, detail, icon: Icon, color, href }) => (
            <a key={label} href={href} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0 active:bg-purplelife-tint">
              <span className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${color}`}><Icon size={20} /></span>
              <span className="flex-1"><span className="block text-[15px] font-semibold">{label}</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">{detail}</span></span>
              <ChevronRight size={18} className="text-purplelife-muted" />
            </a>
          ))}
        </div>
      </section>
      <section className="mt-5 px-5"><a href="/risk" className="flex items-center gap-4 rounded-[24px] bg-purplelife-tint p-4"><ShieldCheck size={23} className="text-purplelife-accent" /><span className="flex-1"><span className="block text-[14px] font-semibold">Review health context</span><span className="mt-1 block text-[12px] text-purplelife-muted">Understand what PurpleLife can and cannot tell you.</span></span><ChevronRight size={18} /></a></section>
    </>
  );
}

const vitalRows = [
  { label: "Resting heart rate", value: "68 bpm", note: "Recorded yesterday", icon: HeartPulse, color: "text-purplelife-pink" },
  { label: "Temperature", value: "98.2°", note: "Recorded Monday", icon: Thermometer, color: "text-purplelife-coral" },
  { label: "Breathing", value: "15/min", note: "Recorded Monday", icon: Wind, color: "text-purplelife-blue" },
];

function VitalsScreen() {
  const [range, setRange] = useState("Week");
  return (
    <>
      <DetailHeader title="Vitals" backHref="/my-health" action={<a href="/capture" aria-label="Add measurement" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></a>} />
      <section className="px-5 pt-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Recorded measurements</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-[1.03] tracking-[-0.045em]">A simple view of recent readings.</h1>
        <p className="mt-3 max-w-[340px] text-[15px] leading-[1.4] text-purplelife-muted">PurpleLife shows the measurements you enter or connect. It does not diagnose changes.</p>
      </section>
      <section className="mt-5 px-5"><VitalWave className="w-full" /></section>
      <section className="mt-6 px-5"><div className="grid grid-cols-3 rounded-[18px] bg-purplelife-rail p-1">{["Week", "Month", "Year"].map((item) => <button key={item} type="button" onClick={() => setRange(item)} className={`h-9 rounded-[14px] text-[12px] font-semibold transition-colors ${range === item ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>{item}</button>)}</div></section>
      <section className="mt-5 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{vitalRows.map(({ label, value, note, icon: Icon, color }) => <button key={label} type="button" className="flex w-full items-center gap-3.5 border-b border-purplelife-line px-4 py-4 text-left last:border-b-0 active:bg-purplelife-tint"><span className={`grid size-11 place-items-center rounded-[15px] bg-purplelife-rail ${color}`}><Icon size={20} /></span><span className="flex-1"><span className="block text-[15px] font-semibold">{label}</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">{note}</span></span><span className="text-[14px] font-semibold">{value}</span></button>)}</div></section>
    </>
  );
}

function RiskScreen() {
  const [alerts, setAlerts] = useState(false);
  return (
    <>
      <DetailHeader title="Health context" backHref="/my-health" />
      <section className="px-5 pt-1 text-center"><PrivacyShield className="mx-auto w-full max-w-[335px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Careful by design</p><h1 className="mx-auto mt-2 max-w-[340px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Your journal is context, not a diagnosis.</h1><p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.4] text-purplelife-muted">PurpleLife can help you review what you recorded. It cannot determine your medical risk or replace professional care.</p></section>
      <section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><div className="flex gap-4 border-b border-purplelife-line p-4"><span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-purplelife-mint/20 text-purplelife-mint"><Check size={20} /></span><div><h2 className="text-[15px] font-semibold">What PurpleLife can do</h2><p className="mt-1 text-[13px] leading-[1.4] text-purplelife-muted">Organize entries, show timing, and help you prepare information to discuss.</p></div></div><div className="flex gap-4 p-4"><span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-purplelife-coral/15 text-purplelife-coral"><X size={20} /></span><div><h2 className="text-[15px] font-semibold">What it cannot do</h2><p className="mt-1 text-[13px] leading-[1.4] text-purplelife-muted">Confirm a condition, predict an emergency, or tell you to change treatment.</p></div></div></div></section>
      <section className="mt-5 px-5"><div className="flex items-center gap-4 rounded-[24px] bg-purplelife-tint p-4"><AlertCircle size={22} className="shrink-0 text-purplelife-accent" /><span className="flex-1"><span className="block text-[14px] font-semibold">Journal reminders</span><span className="mt-1 block text-[12px] text-purplelife-muted">Show a reminder when an entry may need attention.</span></span><Toggle checked={alerts} onChange={() => setAlerts(!alerts)} label="Journal reminders" /></div></section>
      <section className="mt-5 px-5"><p className="text-[12px] leading-[1.45] text-purplelife-muted">If you are worried about a symptom or feel unwell, contact a qualified clinician or emergency service.</p></section>
    </>
  );
}

function DnaScreen() {
  const [connectOpen, setConnectOpen] = useState(false);
  return (
    <>
      <DetailHeader title="DNA" backHref="/my-health" />
      <section className="px-5 pt-4 text-center"><DnaRibbon className="w-full" /><p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Optional source</p><h1 className="mx-auto mt-2 max-w-[330px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">No DNA source connected.</h1><p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.4] text-purplelife-muted">Connecting a source is optional. PurpleLife does not use genetic information to diagnose a condition.</p></section>
      <section className="mt-7 px-5"><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-[17px] bg-purplelife-tint text-purplelife-accent"><Dna size={23} /></span><div className="flex-1"><h2 className="text-[15px] font-semibold">Genetic data source</h2><p className="mt-1 text-[12px] text-purplelife-muted">Not connected</p></div></div><button type="button" onClick={() => setConnectOpen(true)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white"><Link2 size={18} /> Review connection</button></div></section>
      <section className="mt-5 px-5"><div className="flex gap-3 rounded-[24px] bg-purplelife-tint p-4"><LockKeyhole size={21} className="mt-0.5 shrink-0 text-purplelife-accent" /><p className="text-[13px] leading-[1.4] text-purplelife-muted">Before connecting, PurpleLife should explain exactly what is imported, how it is stored, and how to disconnect it.</p></div></section>
      {connectOpen && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={() => setConnectOpen(false)}><div role="dialog" aria-modal="true" aria-label="DNA connection information" onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[402px] rounded-[34px] p-5"><div className="flex justify-between gap-4"><div><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Connection review</p><h2 className="mt-1 text-[24px] font-semibold tracking-[-0.035em]">No provider selected</h2></div><button type="button" onClick={() => setConnectOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button></div><p className="mt-4 text-[14px] leading-[1.45] text-purplelife-muted">This visual pilot does not connect an external account. A production flow needs explicit permission, source details, and a clear disconnect action.</p></div></div>}
    </>
  );
}

const threadRows = [
  { name: "Caregiver", preview: "I read the summary you shared.", time: "10:42 AM", color: "bg-purplelife-blue" },
  { name: "Care team", preview: "Your appointment note is ready to review.", time: "Monday", color: "bg-purplelife-accent" },
];

function MessagesScreen() {
  const [thread, setThread] = useState<(typeof threadRows)[number] | null>(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <>
      <DetailHeader title="Messages" backHref="/browse" action={<a href="/chat" aria-label="New message" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></a>} />
      <section className="px-5 pt-1 text-center"><MessageBubbles className="mx-auto w-full max-w-[350px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Private conversations</p><h1 className="mx-auto mt-2 max-w-[330px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Keep shared context together.</h1><p className="mx-auto mt-3 max-w-[325px] text-[15px] leading-[1.4] text-purplelife-muted">Review conversations connected to caregivers and information you chose to share.</p></section>
      <section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{threadRows.map((item) => <button key={item.name} type="button" onClick={() => { setThread(item); setDraft(""); setSent(false); }} className="flex w-full items-center gap-3.5 border-b border-purplelife-line px-4 py-4 text-left last:border-b-0 active:bg-purplelife-tint"><span className={`grid size-11 place-items-center rounded-full ${item.color} text-white`}><MessageCircle size={20} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className="text-[15px] font-semibold">{item.name}</span><span className="text-[10px] text-purplelife-muted">{item.time}</span></span><span className="mt-1 block truncate text-[12px] text-purplelife-muted">{item.preview}</span></span><ChevronRight size={18} className="text-purplelife-muted" /></button>)}</div></section>
      <section className="mt-5 px-5"><div className="flex gap-3 rounded-[24px] bg-purplelife-tint p-4"><ShieldCheck size={21} className="mt-0.5 shrink-0 text-purplelife-accent" /><p className="text-[13px] leading-[1.4] text-purplelife-muted">Messages do not change what someone can view. Sharing permissions stay under Sharing.</p></div></section>
      {thread && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={() => setThread(null)}><div role="dialog" aria-modal="true" aria-label={`${thread.name} conversation`} onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[402px] rounded-[34px] p-5"><div className="flex items-center justify-between"><div><p className="text-[12px] text-purplelife-muted">Conversation with</p><h2 className="text-[22px] font-semibold tracking-[-0.03em]">{thread.name}</h2></div><button type="button" onClick={() => setThread(null)} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button></div><div className="mt-5 rounded-[20px] bg-white/70 p-4 text-[14px] leading-[1.45] ring-1 ring-white">{thread.preview}</div>{sent && <p className="mt-3 rounded-[18px] bg-purplelife-accent px-4 py-3 text-right text-[14px] text-white">{draft}</p>}<div className="mt-4 flex gap-2"><input value={draft} onChange={(event) => { setDraft(event.target.value); setSent(false); }} placeholder="Write a message" className="h-12 min-w-0 flex-1 rounded-[18px] bg-white/70 px-4 text-[14px] outline-none ring-1 ring-white focus:ring-purplelife-accent/40" /><button type="button" aria-label="Send message" disabled={!draft.trim()} onClick={() => setSent(true)} className="grid size-12 place-items-center rounded-full bg-purplelife-accent text-white disabled:opacity-35"><Send size={19} /></button></div></div></div>}
    </>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-pilot-expanded-page
 * @ployComponentType page
 * @ployComponentDescription Connected PurpleLife mobile page family for health, vitals, risk context, optional DNA sources, and private messages.
 * @ployComponentTags purplelife pilot mobile health vitals messages
 * @ployComponentStatus experimental
 */
export function PilotExpandedPage({ kind }: ExpandedPageProps) {
  return (
    <PilotAppShell active="browse" landscape="detail">
      {kind === "health" && <HealthScreen />}
      {kind === "vitals" && <VitalsScreen />}
      {kind === "risk" && <RiskScreen />}
      {kind === "dna" && <DnaScreen />}
      {kind === "messages" && <MessagesScreen />}
    </PilotAppShell>
  );
}
