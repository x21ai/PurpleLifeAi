import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudDownload,
  Database,
  Download,
  Droplets,
  FileHeart,
  FileUp,
  Globe2,
  HeartHandshake,
  HeartPulse,
  Languages,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Plane,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { DetailHeader, Toggle } from "@/components/pages/pilot/detail/page";
import {
  CaptureHalo,
  JournalRibbon,
  MessageBubbles,
  MorningRhythmGraphic,
  SharingRings,
  SignalOrb,
  TrendConstellation,
  VitalWave,
} from "@/components/pages/pilot/components/mobile-graphics";

export type HealthWorkflowKind =
  | "account"
  | "travel"
  | "journal-entry"
  | "seizure-entry"
  | "care"
  | "plan"
  | "insights"
  | "data"
  | "care-messages"
  | "health-import"
  | "hydration";

function ActionRow({ icon, title, detail, href }: { icon: ReactNode; title: string; detail: string; href?: string }) {
  const body = <><span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent">{icon}</span><span className="min-w-0 flex-1 text-left"><span className="block text-[14px] font-semibold">{title}</span><span className="mt-1 block text-[12px] leading-[1.35] text-purplelife-muted">{detail}</span></span>{href && <ChevronRight size={18} className="text-purplelife-muted" />}</>;
  return href ? <a href={href} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0">{body}</a> : <div className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0">{body}</div>;
}

function StatusNote({ children }: { children: ReactNode }) {
  return <p role="status" className="mt-4 flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted"><ShieldCheck size={19} className="shrink-0 text-purplelife-accent" />{children}</p>;
}

function JournalEntryScreen({ seizure = false }: { seizure?: boolean }) {
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState(seizure ? "Aware" : "Symptom");
  const [saved, setSaved] = useState(false);
  const choices = seizure ? ["Aware", "Partly aware", "Not aware"] : ["Symptom", "Medication", "Sleep", "General note"];
  return <>
    <DetailHeader title={seizure ? "Record seizure" : "New journal entry"} backHref={seizure ? "/today" : "/journal"} />
    <section className="px-5 pt-1 text-center"><CaptureHalo className="mx-auto w-full max-w-[330px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">{seizure ? "Event record" : "Private journal"}</p><h1 className="mx-auto mt-2 max-w-[380px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">{seizure ? "Capture what happened while it is clear." : "Anything you want to remember tomorrow."}</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">{seizure ? "Record timing, awareness, and context. This entry does not diagnose or classify the event." : "Add one detail now, then return when you have more context."}</p></section>
    <section className="mt-7 px-5"><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><p className="text-[12px] font-semibold text-purplelife-muted">{seizure ? "Awareness" : "Entry type"}</p><div className="mt-3 flex flex-wrap gap-2">{choices.map((choice) => <button key={choice} type="button" onClick={() => { setSelected(choice); setSaved(false); }} className={`min-h-10 rounded-full px-4 text-[12px] font-semibold ${selected === choice ? "bg-purplelife-accent text-white" : "bg-purplelife-rail text-purplelife-muted"}`}>{choice}</button>)}</div>{seizure && <label className="mt-5 block text-[12px] font-semibold text-purplelife-muted">Approximate duration<input type="text" placeholder="For example, 2 minutes" className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 text-[14px] text-purplelife-ink outline-none focus:ring-2 focus:ring-purplelife-accent/30" /></label>}<label className="mt-5 block text-[12px] font-semibold text-purplelife-muted">What do you want to remember?<textarea value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} rows={4} placeholder={seizure ? "What you noticed before, during, or after" : "Write a short note"} className="mt-2 w-full resize-none rounded-[18px] bg-purplelife-rail p-4 text-[14px] leading-[1.5] text-purplelife-ink outline-none placeholder:font-normal placeholder:text-purplelife-muted/60 focus:ring-2 focus:ring-purplelife-accent/30" /></label><button type="button" onClick={() => setSaved(true)} disabled={!note.trim()} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white disabled:bg-purplelife-rail disabled:text-purplelife-muted disabled:opacity-100"><Check size={18} />Save {seizure ? "event" : "entry"}</button>{saved && <><StatusNote>Saved on this screen as a prototype. The production action belongs to the Cloudflare data service.</StatusNote><a href={seizure ? "/today" : "/journal"} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-purplelife-tint text-[13px] font-semibold text-purplelife-accent">{seizure ? "Return to Today" : "Review journal"}<ChevronRight size={17} /></a></>}</div></section>
  </>;
}

function CareScreen() {
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitationPrepared, setInvitationPrepared] = useState(false);
  const [mode, setMode] = useState<"empty" | "sample">("empty");
  return <><DetailHeader title="Care" backHref="/browse" action={<button type="button" onClick={() => { setInviting((value) => !value); setInvitationPrepared(false); }} aria-label="Invite caregiver" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></button>} /><section className="px-5 pt-1 text-center"><SharingRings className="mx-auto w-full max-w-[340px]" /><p className="-mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Shared care</p><h1 className="mx-auto mt-2 max-w-[380px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Manage who you support and who supports you.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Each person controls what can be viewed and can remove access at any time.</p></section><section className="mt-7 px-5"><div className="mb-4 flex rounded-[18px] bg-purplelife-rail p-1"><button type="button" onClick={() => setMode("empty")} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "empty" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Empty state</button><button type="button" onClick={() => setMode("sample")} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "sample" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Sample care</button></div>{inviting && <div className="mb-4 rounded-[26px] bg-purplelife-tint p-4"><label className="text-[12px] font-semibold">Caregiver email<input type="email" value={inviteEmail} onChange={(event) => { setInviteEmail(event.target.value); setInvitationPrepared(false); }} placeholder="name@example.com" className="mt-2 h-12 w-full rounded-[16px] bg-white px-4 text-[14px] outline-none ring-1 ring-purplelife-line" /></label><button type="button" disabled={!inviteEmail.trim()} onClick={() => { setInviting(false); setInvitationPrepared(true); }} className="mt-3 min-h-11 w-full rounded-[16px] bg-purplelife-accent text-[13px] font-semibold text-white disabled:bg-purplelife-rail disabled:text-purplelife-muted">Prepare invitation</button></div>}{invitationPrepared && <div className="mb-4 rounded-[22px] bg-purplelife-tint p-4"><StatusNote>Invitation prepared in this visual preview only. No email or access token was created.</StatusNote><a href="/settings/sharing" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-white text-[13px] font-semibold text-purplelife-accent ring-1 ring-purplelife-line">Review sharing controls<ChevronRight size={17} /></a></div>}{mode === "empty" ? <div className="rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line"><HeartHandshake size={27} className="mx-auto text-purplelife-accent" /><p className="mt-3 text-[15px] font-semibold">No care connections yet</p><p className="mx-auto mt-2 max-w-[290px] text-[12px] leading-[1.45] text-purplelife-muted">Invitations and people who share with you will appear here after explicit approval.</p></div> : <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><ActionRow icon={<HeartHandshake size={20} />} title="Sam · sample connection" detail="Shares reports and medication history read-only." href="/care/care-preview" /><ActionRow icon={<UserRound size={20} />} title="Alex · pending invitation" detail="Invitation is waiting for sample approval." href="/settings/sharing" /><ActionRow icon={<MessageCircle size={20} />} title="Care inbox · 2 sample updates" detail="Questions and updates from connected people." href="/care/inbox" /></div>}<StatusNote>Care access is read-only, scoped by the account owner, and removable.</StatusNote></section></>;
}

function AccountScreen() {
  const [language, setLanguage] = useState("English");
  const [privateAlerts, setPrivateAlerts] = useState(true);
  const [saved, setSaved] = useState(false);
  return <><DetailHeader title="Account" backHref="/settings" /><section className="px-5 pt-4"><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Your account</p><h1 className="mt-2 text-[32px] font-semibold leading-[1.03] tracking-[-0.045em]">Profile, region, privacy, and session.</h1><p className="mt-3 max-w-[390px] text-[15px] leading-[1.45] text-purplelife-muted">Keep the settings that shape dates, language, notifications, and account access in one place.</p></section><section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><ActionRow icon={<UserRound size={20} />} title="Profile" detail="Name and account identity" /><div className="border-b border-purplelife-line px-4 py-4"><label className="text-[12px] font-semibold text-purplelife-muted">Language<select value={language} onChange={(event) => { setLanguage(event.target.value); setSaved(false); }} className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 text-[14px] text-purplelife-ink outline-none"><option>English</option><option>Spanish</option><option>French</option></select></label></div><div className="flex items-center gap-3.5 px-4 py-4"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent"><Bell size={20} /></span><span className="flex-1"><span className="block text-[14px] font-semibold">Private reminders</span><span className="mt-1 block text-[12px] text-purplelife-muted">Show journal and medication reminders</span></span><Toggle checked={privateAlerts} onChange={() => setPrivateAlerts((value) => !value)} label="Private reminders" /></div></div><button type="button" onClick={() => setSaved(true)} className="mt-4 min-h-12 w-full rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white">{saved ? "Settings saved" : "Save account settings"}</button><a href="/sign-in" className="mt-3 flex min-h-11 items-center justify-center text-[13px] font-semibold text-purplelife-muted">Sign out of this prototype</a></section></>;
}

function TravelScreen() {
  const [destination, setDestination] = useState("");
  const [preview, setPreview] = useState(false);
  return <><DetailHeader title="Travel planning" backHref="/settings" /><section className="px-5 pt-1 text-center"><MorningRhythmGraphic className="mx-auto w-full max-w-[345px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Medication timing</p><h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Plan around a new time zone.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Preview how recorded schedules may shift. Confirm medication timing with your clinician or pharmacist.</p></section><section className="mt-7 px-5"><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><label className="text-[12px] font-semibold text-purplelife-muted">Destination<input value={destination} onChange={(event) => { setDestination(event.target.value); setPreview(false); }} placeholder="City or time zone" className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 text-[14px] outline-none" /></label><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-[12px] font-semibold text-purplelife-muted">Departure<input type="date" className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-3 text-[13px] outline-none" /></label><label className="text-[12px] font-semibold text-purplelife-muted">Return<input type="date" className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-3 text-[13px] outline-none" /></label></div><button type="button" disabled={!destination.trim()} onClick={() => setPreview(true)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white disabled:opacity-35"><Plane size={18} />Preview schedule</button>{preview && <div className="mt-4 rounded-[22px] bg-purplelife-tint p-4"><p className="text-[13px] font-semibold">Trip to {destination}</p><p className="mt-2 text-[12px] leading-[1.45] text-purplelife-muted">A production preview would show each recorded dose in its local time before anything is saved.</p></div>}</div></section></>;
}

function PlanScreen({ insights = false }: { insights?: boolean }) {
  const [checked, setChecked] = useState<string[]>([]);
  const items = insights ? ["Sleep and morning check-ins appeared together", "Two symptoms were recorded after shorter nights", "Medication entries are most complete before noon"] : ["Keep morning check-ins short", "Record medication when it happens", "Bring three questions to the next appointment"];
  return <><DetailHeader title={insights ? "Insights" : "Plan"} backHref="/browse" /><section className="px-5 pt-1 text-center"><TrendConstellation className="mx-auto w-full max-w-[350px]" /><p className="-mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">{insights ? "Observed patterns" : "This week"}</p><h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">{insights ? "A few details appeared together." : "A small plan you can change anytime."}</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">{insights ? "These observations come from what was recorded. They do not show cause or provide a diagnosis." : "Choose what feels useful. PurpleLife does not prescribe treatment or medication changes."}</p></section><section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{items.map((item, index) => { const active = checked.includes(item); return <button key={item} type="button" onClick={() => setChecked((current) => active ? current.filter((value) => value !== item) : [...current, item])} className="flex w-full items-center gap-3.5 border-b border-purplelife-line px-4 py-4 text-left last:border-b-0"><span className={`grid size-10 shrink-0 place-items-center rounded-full ${active ? "bg-purplelife-accent text-white" : "bg-purplelife-rail text-purplelife-accent"}`}>{active ? <Check size={18} /> : insights ? <Sparkles size={18} /> : <CalendarDays size={18} />}</span><span className="flex-1 text-[14px] font-semibold">{item}</span></button>; })}</div><a href={insights ? "/journal" : "/today"} className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white">{insights ? "Review the source entries" : "Return to today"}<ChevronRight size={18} /></a></section></>;
}

function DataScreen() {
  const [includePhotos, setIncludePhotos] = useState(false);
  const [prepared, setPrepared] = useState(false);
  return <><DetailHeader title="Your data" backHref="/settings" /><section className="px-5 pt-1 text-center"><SignalOrb className="mx-auto w-full max-w-[330px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Control and portability</p><h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Review what is stored and prepare an export.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Production exports are prepared by the Cloudflare service and should contain only data belonging to the signed-in account.</p></section><section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><ActionRow icon={<Database size={20} />} title="Journal and health records" detail="Entries, medication, sleep, vitals, and selected settings" /><div className="flex items-center gap-3.5 px-4 py-4"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent"><FileHeart size={20} /></span><span className="flex-1"><span className="block text-[14px] font-semibold">Include uploaded photos</span><span className="mt-1 block text-[12px] text-purplelife-muted">May increase export preparation time</span></span><Toggle checked={includePhotos} onChange={() => setIncludePhotos((value) => !value)} label="Include photos" /></div></div><button type="button" onClick={() => setPrepared(true)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white">{prepared ? <Check size={18} /> : <Download size={18} />}{prepared ? "Export request prepared" : "Prepare my export"}</button><StatusNote>This prototype does not read, export, or delete production health data.</StatusNote></section></>;
}

function CareMessagesScreen() {
  const [tab, setTab] = useState<"updates" | "requests">("updates");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);
  return <><DetailHeader title="Care inbox" backHref="/care" /><section className="px-5 pt-1 text-center"><MessageBubbles className="mx-auto w-full max-w-[330px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Private care messages</p><h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Questions and updates stay separate from sharing permissions.</h1></section><section className="mt-7 px-5"><div className="flex rounded-[18px] bg-purplelife-rail p-1">{(["updates", "requests"] as const).map((value) => <button key={value} type="button" onClick={() => setTab(value)} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold capitalize ${tab === value ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>{value}</button>)}</div><div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><p className="text-[13px] font-semibold">{tab === "updates" ? "No new care updates" : "No pending access requests"}</p><p className="mt-2 text-[12px] leading-[1.45] text-purplelife-muted">{tab === "updates" ? "Messages from connected caregivers will appear here." : "Requests to change shared information require an explicit decision."}</p></div><div className="purplelife-glass-clear mt-4 flex items-center gap-2 rounded-[22px] p-2"><input value={draft} onChange={(event) => { setDraft(event.target.value); setSent(false); }} placeholder="Write a care message" className="h-10 min-w-0 flex-1 bg-transparent px-2 text-[14px] outline-none" /><button type="button" disabled={!draft.trim()} onClick={() => setSent(true)} className="grid size-10 place-items-center rounded-full bg-purplelife-accent text-white disabled:opacity-35"><Send size={18} /></button></div>{sent && <StatusNote>Message added to this prototype view only.</StatusNote>}</section></>;
}

function HealthImportScreen() {
  const [fileName, setFileName] = useState("");
  const [reviewed, setReviewed] = useState(false);
  return <><DetailHeader title="Apple Health import" backHref="/tools" /><section className="px-5 pt-1 text-center"><VitalWave className="mx-auto w-full max-w-[350px]" /><p className="-mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Import health data</p><h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Review a Health export before adding anything.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Choose a supported export, inspect the categories found, then decide what belongs in PurpleLife.</p></section><section className="mt-7 px-5"><label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-purplelife-accent/35 bg-white p-6 text-center shadow-sm"><FileUp size={28} className="text-purplelife-accent" /><span className="mt-3 text-[14px] font-semibold">Choose Apple Health export</span><span className="mt-1 text-[12px] text-purplelife-muted">ZIP or XML · nothing uploads from this prototype</span><input type="file" accept=".zip,.xml" className="sr-only" onChange={(event) => { setFileName(event.target.files?.[0]?.name ?? ""); setReviewed(false); }} /></label>{fileName && <div className="mt-4 rounded-[24px] bg-purplelife-tint p-4"><p className="text-[13px] font-semibold">{fileName}</p><p className="mt-1 text-[12px] text-purplelife-muted">Ready for a private category review.</p><button type="button" onClick={() => setReviewed(true)} className="mt-3 min-h-11 w-full rounded-[16px] bg-purplelife-accent text-[13px] font-semibold text-white">Review categories</button></div>}{reviewed && <StatusNote>Review prepared. The production import is processed by the Cloudflare backend after confirmation.</StatusNote>}</section></>;
}

function HydrationScreen() {
  const [total, setTotal] = useState(0);
  const goal = 2000;
  const percentage = Math.min((total / goal) * 100, 100);
  return <><DetailHeader title="Hydration" backHref="/today" /><section className="px-5 pt-1 text-center"><VitalWave className="mx-auto w-full max-w-[350px]" /><p className="-mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Today</p><h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Record water without turning it into a score.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Add what you drank if it helps with context. PurpleLife does not set a medical hydration target.</p></section><section className="mt-7 px-5"><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><div className="flex items-end justify-between"><span><span className="block text-[13px] text-purplelife-muted">Recorded today</span><span className="mt-1 block text-[30px] font-semibold tracking-[-0.04em]">{total} ml</span></span><Droplets size={28} className="text-purplelife-accent" /></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-purplelife-rail"><div className="h-full rounded-full bg-purplelife-accent transition-[width] duration-500" style={{ width: `${percentage}%` }} /></div><div className="mt-5 grid grid-cols-3 gap-2">{[250, 350, 500].map((amount) => <button key={amount} type="button" onClick={() => setTotal((value) => value + amount)} className="min-h-11 rounded-[16px] bg-purplelife-tint text-[12px] font-semibold text-purplelife-accent">+{amount} ml</button>)}</div><button type="button" disabled={total === 0} onClick={() => setTotal(0)} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 text-[12px] font-semibold text-purplelife-muted disabled:opacity-35"><Trash2 size={16} />Clear today&apos;s prototype</button></div></section></>;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-health-workflows-page
 * @ployComponentType page
 * @ployComponentDescription Route-specific PurpleLife workflows for account, care, capture, planning, data, imports, and hydration, including empty and populated care states.
 * @ployComponentTags purplelife health workflows cloudflare
 * @ployComponentStatus stable
 */
export function HealthWorkflowsPage({ kind }: { kind: HealthWorkflowKind }) {
  const landscape = useMemo(() => kind === "account" || kind === "data" ? "detail" as const : "insight" as const, [kind]);
  return <PilotAppShell active={kind === "journal-entry" || kind === "seizure-entry" ? "journal" : kind === "hydration" ? "today" : "browse"} landscape={landscape}>
    {kind === "account" && <AccountScreen />}
    {kind === "travel" && <TravelScreen />}
    {kind === "journal-entry" && <JournalEntryScreen />}
    {kind === "seizure-entry" && <JournalEntryScreen seizure />}
    {kind === "care" && <CareScreen />}
    {kind === "plan" && <PlanScreen />}
    {kind === "insights" && <PlanScreen insights />}
    {kind === "data" && <DataScreen />}
    {kind === "care-messages" && <CareMessagesScreen />}
    {kind === "health-import" && <HealthImportScreen />}
    {kind === "hydration" && <HydrationScreen />}
  </PilotAppShell>;
}
