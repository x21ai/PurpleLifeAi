import { useState, type ReactNode } from "react";
import {
  Bell,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  LockKeyhole,
  Mic2,
  MoonStar,
  NotebookPen,
  Pill,
  Plus,
  Share2,
  ShieldCheck,
  Sparkles,
  Sunrise,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { PURPLELIFE_JOURNEY_ROUTES } from "@/lib/purplelife-interactions";
import {
  CaptureHalo,
  MedicationOrbit,
  PrivacyShield,
  SharingRings,
  SignalOrb,
  TrendConstellation,
} from "../components/mobile-graphics";

export type PilotDetailKind = "capture" | "trends" | "sharing" | "medication" | "sleep" | "settings";

type DetailPageProps = {
  kind: PilotDetailKind;
};

type DetailHeaderProps = {
  title: string;
  backHref: string;
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function DetailHeader({ title, backHref, action, className = "", titleClassName = "" }: DetailHeaderProps) {
  return (
    <header className={`flex items-center justify-between px-5 pt-3 ${className}`}>
      <a href={backHref} aria-label="Go back" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-ink transition-transform active:scale-95">
        <ChevronLeft size={22} />
      </a>
      <p className={`text-[15px] font-semibold ${titleClassName}`}>{title}</p>
      <div className="flex size-10 items-center justify-center">{action}</div>
    </header>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={`relative h-7 w-12 rounded-full p-0.5 transition-colors duration-300 ${checked ? "bg-purplelife-accent" : "bg-purplelife-line"}`}>
      <span className={`block size-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

const captureChoices = [
  { label: "Symptom", detail: "How it feels and when it started", icon: Sparkles, color: "bg-purplelife-pink/15 text-purplelife-pink" },
  { label: "Note", detail: "Anything you want to remember", icon: NotebookPen, color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { label: "Photo", detail: "Add visual context privately", icon: Camera, color: "bg-purplelife-yellow/20 text-purplelife-coral" },
  { label: "Voice", detail: "Talk now and review the transcript", icon: Mic2, color: "bg-purplelife-accent/15 text-purplelife-accent" },
  { label: "Medication", detail: "Record a scheduled or extra dose", icon: Pill, color: "bg-purplelife-mint/20 text-purplelife-mint" },
  { label: "Sleep", detail: "Bedtime, wake time, and restfulness", icon: MoonStar, color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
];

function CaptureScreen() {
  const [selected, setSelected] = useState<(typeof captureChoices)[number] | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);

  return (
    <>
      <DetailHeader title="Capture" backHref="/today" />
      <section className="px-5 pt-2 text-center">
        <CaptureHalo className="mx-auto w-full max-w-[330px]" />
        <p className="-mt-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Add to today</p>
        <h1 className="mx-auto mt-2 max-w-[320px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">What would you like to remember?</h1>
        <p className="mx-auto mt-3 max-w-[310px] text-[15px] leading-[1.4] text-purplelife-muted">Capture one detail now. You can add context or change it later.</p>
      </section>

      {savedLabel && (
        <section className="mt-6 px-5" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-[24px] bg-purplelife-mint/15 p-4 text-left">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-purplelife-mint"><Check size={19} /></span>
            <span className="flex-1"><span className="block text-[14px] font-semibold">{savedLabel} saved to today</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">This preview keeps the entry on this screen only.</span></span>
            <a href={PURPLELIFE_JOURNEY_ROUTES.journal} className="text-[12px] font-semibold text-purplelife-accent">Journal</a>
          </div>
        </section>
      )}

      <section className={savedLabel ? "mt-4 px-5" : "mt-7 px-5"}>
        <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
          {captureChoices.map((choice) => {
            const Icon = choice.icon;
            return (
              <button key={choice.label} type="button" onClick={() => { setSavedLabel(null); setSelected(choice); }} className="flex w-full items-center gap-3.5 border-b border-purplelife-line px-4 py-3.5 text-left last:border-b-0 active:bg-purplelife-tint">
                <span className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${choice.color}`}><Icon size={20} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{choice.label}</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">{choice.detail}</span></span>
                <ChevronRight size={18} className="text-purplelife-muted" />
              </button>
            );
          })}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={() => setSelected(null)}>
          <div role="dialog" aria-modal="true" aria-label={`${selected.label} capture`} onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[402px] rounded-[34px] p-5">
            <div className="flex items-start justify-between"><div><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">New entry</p><h2 className="mt-1 text-[25px] font-semibold tracking-[-0.035em]">{selected.label}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button></div>
            <div className="mt-5 rounded-[22px] bg-white/70 p-4 ring-1 ring-white"><p className="text-[14px] text-purplelife-muted">{selected.detail}</p><div className="mt-5 h-20 rounded-[16px] border border-dashed border-purplelife-line bg-white/60" /></div>
            <button type="button" onClick={() => { setSavedLabel(selected.label); setSelected(null); }} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[15px] font-semibold text-white"><Check size={18} /> Save entry</button>
          </div>
        </div>
      )}
    </>
  );
}

const trendDays = [58, 72, 48, 82, 66, 90, 76];

function TrendsScreen() {
  return (
    <>
      <DetailHeader title="Patterns" backHref="/browse" />
      <section className="px-5 pt-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Last seven days</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-[1.03] tracking-[-0.045em]">A few details appeared together.</h1>
        <p className="mt-3 max-w-[350px] text-[15px] leading-[1.4] text-purplelife-muted">These are observations from what you recorded, not medical conclusions.</p>
      </section>
      <section className="mt-5 px-5"><TrendConstellation className="w-full" /></section>
      <section className="mt-7 px-5">
        <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line">
          <div className="flex items-end justify-between"><div><p className="text-[13px] font-medium text-purplelife-muted">Journal completeness</p><p className="mt-1 text-[27px] font-semibold tracking-[-0.04em]">4 of 5 areas</p></div><span className="rounded-full bg-purplelife-tint px-3 py-1.5 text-[11px] font-semibold text-purplelife-accent">Steady</span></div>
          <div className="mt-6 flex h-28 items-end justify-between gap-2">
            {trendDays.map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-full bg-purplelife-accent/20 p-1"><div className="w-full rounded-full bg-purplelife-accent" style={{ height }} /></div><span className="text-[10px] font-medium text-purplelife-muted">{"MTWTFSS"[index]}</span></div>)}
          </div>
        </div>
      </section>
      <section className="mt-7 px-5"><a href="/sleep" className="flex items-center gap-4 rounded-[26px] bg-purplelife-peach p-4"><span className="grid size-12 place-items-center rounded-[17px] bg-white/70 text-purplelife-indigo"><MoonStar size={23} /></span><span className="flex-1"><span className="block text-[15px] font-semibold">Sleep and morning notes</span><span className="mt-1 block text-[12px] leading-snug text-purplelife-muted">Appeared together three times this week.</span></span><ChevronRight size={18} /></a></section>
    </>
  );
}

function SharingScreen() {
  const [summary, setSummary] = useState(true);
  const [journal, setJournal] = useState(true);
  const [photos, setPhotos] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);

  return (
    <>
      <DetailHeader title="Sharing" backHref="/browse" action={<button type="button" aria-label="Add person" aria-expanded={connectionOpen} onClick={() => setConnectionOpen(true)} className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></button>} />
      <section className="px-5 pt-1 text-center"><SharingRings className="mx-auto w-full max-w-[340px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Read-only access</p><h1 className="mx-auto mt-2 max-w-[330px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Share only what helps.</h1><p className="mx-auto mt-3 max-w-[320px] text-[15px] leading-[1.4] text-purplelife-muted">You choose the person, the information, and when access ends.</p></section>
      <section className="mt-7 px-5"><h2 className="text-[21px] font-semibold tracking-[-0.035em]">Shared with Maya</h2><div className="mt-3 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
        {[{ label: "Weekly summary", detail: "High-level patterns", value: summary, set: () => setSummary(!summary) }, { label: "Journal entries", detail: "Notes and recorded events", value: journal, set: () => setJournal(!journal) }, { label: "Photos", detail: "Images attached to entries", value: photos, set: () => setPhotos(!photos) }].map((item) => <div key={item.label} className="flex items-center gap-4 border-b border-purplelife-line px-4 py-4 last:border-b-0"><span className="flex-1"><span className="block text-[15px] font-semibold">{item.label}</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">{item.detail}</span></span><Toggle checked={item.value} onChange={item.set} label={`Share ${item.label}`} /></div>)}
      </div></section>
      <section className="mt-5 px-5"><div className="flex gap-3 rounded-[24px] bg-purplelife-tint p-4"><ShieldCheck className="mt-0.5 shrink-0 text-purplelife-accent" size={21} /><p className="text-[13px] leading-[1.4] text-purplelife-muted">Maya can view selected information but cannot change your journal. You can remove access at any time.</p></div></section>

      {connectionOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={() => setConnectionOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Add a sharing connection" onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[402px] rounded-[34px] p-5">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Sharing preview</p><h2 className="mt-1 text-[24px] font-semibold tracking-[-0.035em]">Choose a connection.</h2></div><button type="button" onClick={() => setConnectionOpen(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button></div>
            <div className="mt-5 overflow-hidden rounded-[24px] bg-white/70 ring-1 ring-white">
              <a href={PURPLELIFE_JOURNEY_ROUTES.careInvitation} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent"><UserRound size={20} /></span><span className="flex-1"><span className="block text-[14px] font-semibold">Caregiver invitation</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">Preview selected read-only access</span></span><ChevronRight size={18} /></a>
              <a href={PURPLELIFE_JOURNEY_ROUTES.friendInvitation} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-blue/15 text-purplelife-blue"><Share2 size={20} /></span><span className="flex-1"><span className="block text-[14px] font-semibold">Friend invitation</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">Preview a limited support connection</span></span><ChevronRight size={18} /></a>
              <a href={PURPLELIFE_JOURNEY_ROUTES.sharedReport} className="flex items-center gap-3.5 px-4 py-4"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-peach text-purplelife-coral"><Download size={20} /></span><span className="flex-1"><span className="block text-[14px] font-semibold">Shared report</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">Review a read-only journal summary</span></span><ChevronRight size={18} /></a>
            </div>
            <p className="mt-4 text-[12px] leading-[1.4] text-purplelife-muted">These routes demonstrate the invitation and report states. They do not send or accept live access.</p>
          </div>
        </div>
      )}
    </>
  );
}

const doses = [
  { name: "Morning dose", time: "8:00 AM", detail: "Recorded", color: "bg-purplelife-mint", done: true },
  { name: "Afternoon dose", time: "2:00 PM", detail: "Recorded", color: "bg-purplelife-blue", done: true },
  { name: "Evening dose", time: "8:00 PM", detail: "Upcoming", color: "bg-purplelife-coral", done: false },
];

function MedicationScreen() {
  const [recorded, setRecorded] = useState(false);

  return (
    <>
      <DetailHeader title="Medication" backHref="/browse" action={<a href="/capture" aria-label="Add medication" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></a>} />
      <section className="px-5 pt-1 text-center"><MedicationOrbit className="mx-auto w-full max-w-[340px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Today</p><h1 className="mt-2 text-[31px] font-semibold tracking-[-0.045em]">2 of 3 recorded</h1><p className="mt-2 text-[15px] text-purplelife-muted">Your next scheduled dose is at 8:00 PM.</p></section>
      <section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{doses.map((dose, index) => { const done = dose.done || (index === 2 && recorded); return <div key={dose.name} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0"><span className={`grid size-11 place-items-center rounded-full ${dose.color} text-white`}>{done ? <Check size={20} /> : <Clock3 size={20} />}</span><span className="flex-1"><span className="block text-[15px] font-semibold">{dose.name}</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">{dose.time} · {done ? "Recorded" : dose.detail}</span></span>{!done && <button type="button" onClick={() => setRecorded(true)} className="rounded-full bg-purplelife-accent px-3 py-2 text-[12px] font-semibold text-white">Record</button>}</div>; })}</div></section>
      <section className="mt-5 px-5"><div className="rounded-[24px] bg-purplelife-tint p-4"><p className="text-[13px] leading-[1.45] text-purplelife-muted">PurpleLife records what you enter. Medication questions and changes should be discussed with your clinician.</p></div></section>
    </>
  );
}

function SleepScreen() {
  return (
    <>
      <DetailHeader title="Sleep" backHref="/browse" />
      <section className="px-5 pt-1 text-center"><SignalOrb className="mx-auto w-full max-w-[350px]" /><p className="-mt-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Last night</p><h1 className="mt-2 text-[31px] font-semibold tracking-[-0.045em]">Your timing stayed familiar.</h1><p className="mx-auto mt-3 max-w-[320px] text-[15px] leading-[1.4] text-purplelife-muted">You recorded a similar bedtime and wake time on five nights this week.</p></section>
      <section className="mt-7 px-5"><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><div className="grid grid-cols-2 gap-4"><div><p className="text-[12px] text-purplelife-muted">Bedtime</p><p className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">10:38 PM</p></div><div><p className="text-[12px] text-purplelife-muted">Wake time</p><p className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">6:23 AM</p></div></div><div className="mt-6 flex h-24 items-end gap-2">{[62,78,70,86,82,92,84].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-full bg-purplelife-indigo/18" style={{ height }}><div className="h-[38%] w-full rounded-full bg-purplelife-indigo" /></div><span className="text-[10px] text-purplelife-muted">{"MTWTFSS"[index]}</span></div>)}</div></div></section>
      <section className="mt-7 px-5"><a href="/insights" className="flex items-center gap-4 rounded-[26px] bg-purplelife-peach p-4"><span className="grid size-12 place-items-center rounded-[17px] bg-white/70 text-purplelife-coral"><Sunrise size={24} /></span><span className="flex-1"><span className="block text-[15px] font-semibold">Longer sleep, calmer mornings</span><span className="mt-1 block text-[12px] leading-snug text-purplelife-muted">Review the related journal observation.</span></span><ChevronRight size={18} /></a></section>
    </>
  );
}

function SettingsScreen() {
  const [reminders, setReminders] = useState(true);
  const [photos, setPhotos] = useState(false);
  const rows = [
    { label: "Your profile", detail: "Name and preferences", icon: UserRound, href: "#profile" },
    { label: "Privacy and safety", detail: "How your information is handled", icon: LockKeyhole, href: "#privacy" },
    { label: "Export your data", detail: "Download a copy of your journal", icon: Download, href: "#export" },
  ];

  return (
    <>
      <DetailHeader title="Settings" backHref="/browse" />
      <section className="px-5 pt-1 text-center"><PrivacyShield className="mx-auto w-full max-w-[340px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Your choices</p><h1 className="mt-2 text-[31px] font-semibold tracking-[-0.045em]">Your health story stays yours.</h1><p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.4] text-purplelife-muted">Review reminders, sharing, privacy, and data controls in one place.</p></section>
      <section className="mt-7 px-5"><h2 className="text-[21px] font-semibold tracking-[-0.035em]">Preferences</h2><div className="mt-3 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><div className="flex items-center gap-4 border-b border-purplelife-line px-4 py-4"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-pink/15 text-purplelife-pink"><Bell size={20} /></span><span className="flex-1"><span className="block text-[15px] font-semibold">Gentle reminders</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">Prompt me to capture my day</span></span><Toggle checked={reminders} onChange={() => setReminders(!reminders)} label="Gentle reminders" /></div><div className="flex items-center gap-4 px-4 py-4"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-blue/15 text-purplelife-blue"><Camera size={20} /></span><span className="flex-1"><span className="block text-[15px] font-semibold">Include photos in export</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">Off by default</span></span><Toggle checked={photos} onChange={() => setPhotos(!photos)} label="Include photos in export" /></div></div></section>
      <section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{rows.map(({ label, detail, icon: Icon, href }) => <a key={label} href={href} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0 active:bg-purplelife-tint"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-rail text-purplelife-accent"><Icon size={20} /></span><span className="flex-1"><span className="block text-[15px] font-semibold">{label}</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">{detail}</span></span><ChevronRight size={18} className="text-purplelife-muted" /></a>)}</div></section>
      <section className="mt-5 px-5"><button type="button" className="flex w-full items-center justify-center gap-2 rounded-[22px] bg-white py-4 text-[14px] font-semibold text-purplelife-coral ring-1 ring-purplelife-line"><Trash2 size={18} /> Review account deletion</button></section>
    </>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-pilot-detail-page
 * @ployComponentType page
 * @ployComponentDescription Shared mobile-first PurpleLife page family for capture, trends, sharing, medication, sleep, and settings experiences.
 * @ployComponentTags purplelife pilot mobile detail
 * @ployComponentStatus experimental
 */
export function PilotDetailPage({ kind }: DetailPageProps) {
  const active = kind === "capture" ? "today" : "browse";

  return (
    <PilotAppShell active={active} landscape={kind === "trends" ? "insight" : "detail"}>
      {kind === "capture" && <CaptureScreen />}
      {kind === "trends" && <TrendsScreen />}
      {kind === "sharing" && <SharingScreen />}
      {kind === "medication" && <MedicationScreen />}
      {kind === "sleep" && <SleepScreen />}
      {kind === "settings" && <SettingsScreen />}
    </PilotAppShell>
  );
}
