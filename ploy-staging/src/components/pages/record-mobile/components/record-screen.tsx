import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  FileHeart,
  Link2,
  LockKeyhole,
  MessageCircle,
  Pill,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { JournalRibbon, MedicationOrbit, MessageBubbles, SharingRings, SignalOrb, TrendConstellation } from "@/components/pages/pilot/components/mobile-graphics";
import { appendLocalMessage } from "@/lib/purplelife-interactions";

export type RecordKind = "medication" | "episode" | "calendar" | "care-link" | "friend-link" | "report" | "sleep-insight" | "conversation" | "community-post" | "profile";

type RecordPageProps = { kind: RecordKind; recordId: string };

const recordCopy: Record<RecordKind, { title: string; backHref: string; eyebrow: string; heading: string; summary: string }> = {
  medication: { title: "Medication", backHref: "/pilot/medication", eyebrow: "Medication record", heading: "Morning medication", summary: "A single place for the schedule, recent entries, and notes you recorded." },
  episode: { title: "Journal entry", backHref: "/pilot/journal", eyebrow: "Recorded event", heading: "A difficult afternoon", summary: "Review the details together without turning one entry into a conclusion." },
  calendar: { title: "Day review", backHref: "/pilot/journal", eyebrow: "Journal timeline", heading: "Tuesday, September 15", summary: "Symptoms, medication, sleep, and notes recorded on this day." },
  "care-link": { title: "Care connection", backHref: "/pilot/sharing", eyebrow: "Shared access", heading: "Caregiver view", summary: "Review exactly what this read-only connection can see." },
  "friend-link": { title: "Friend connection", backHref: "/pilot/sharing", eyebrow: "Support circle", heading: "Trusted friend", summary: "A limited connection for the updates you choose to share." },
  report: { title: "Shared report", backHref: "/pilot/sharing", eyebrow: "Read-only summary", heading: "Health journal summary", summary: "A focused view of the dates and categories selected by its owner." },
  "sleep-insight": { title: "Sleep insight", backHref: "/pilot/sleep", eyebrow: "Observed pattern", heading: "Longer sleep, steadier mornings", summary: "An observation from journal and sleep entries, with the source details kept visible." },
  conversation: { title: "Messages", backHref: "/pilot/messages", eyebrow: "Private conversation", heading: "Care team", summary: "Keep a focused thread beside the information you chose to share." },
  "community-post": { title: "Community", backHref: "/community", eyebrow: "Community discussion", heading: "What helps you prepare for appointments?", summary: "A moderated space for lived experience, not medical instructions." },
  profile: { title: "Community profile", backHref: "/community", eyebrow: "Community member", heading: "A quiet journaler", summary: "Public community activity stays separate from private health records." },
};

function RecordGraphic({ kind }: { kind: RecordKind }) {
  if (kind === "medication") return <MedicationOrbit className="w-full" />;
  if (kind === "episode" || kind === "calendar") return <JournalRibbon className="w-full" />;
  if (kind === "care-link" || kind === "friend-link" || kind === "report") return <SharingRings className="w-full" />;
  if (kind === "sleep-insight") return <TrendConstellation className="w-full" />;
  if (kind === "conversation" || kind === "community-post") return <MessageBubbles className="w-full" />;
  return <SignalOrb className="w-full" />;
}

function InfoRow({ icon: Icon, label, value, href }: { icon: typeof Clock3; label: string; value: string; href?: string }) {
  const inner = <><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-purplelife-tint text-purplelife-accent"><Icon size={19} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-purplelife-muted">{label}</span><span className="mt-1 block text-[14px] font-semibold leading-snug">{value}</span></span>{href && <ChevronRight size={18} className="text-purplelife-muted" />}</>;
  return href ? <a href={href} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0">{inner}</a> : <div className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0">{inner}</div>;
}

function MedicationDetail() {
  const [recorded, setRecorded] = useState(false);
  return <><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><InfoRow icon={Clock3} label="Schedule" value="Every morning · 8:00 AM" /><InfoRow icon={Pill} label="Instructions" value="Follow the plan recorded with your clinician" /><InfoRow icon={CalendarDays} label="Recent entry" value="Today · 8:04 AM" href="/meds/history" /></div><button type="button" onClick={() => setRecorded(true)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white"><Check size={18} />{recorded ? "Recorded for today" : "Record today’s dose"}</button><p className="mt-3 text-center text-[12px] leading-[1.4] text-purplelife-muted">This preview updates only the current screen. It does not change a medication record.</p></>;
}

function JournalDetail({ calendar = false }: { calendar?: boolean }) {
  return <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><InfoRow icon={Clock3} label={calendar ? "Morning" : "Time"} value={calendar ? "Slept 7h 42m · woke feeling steady" : "2:18 PM · lasted about 25 minutes"} /><InfoRow icon={FileHeart} label={calendar ? "Afternoon" : "What was recorded"} value={calendar ? "Head pressure and low energy recorded" : "Head pressure, sensitivity to light, and low energy"} /><InfoRow icon={Pill} label={calendar ? "Medication" : "Context"} value={calendar ? "Morning dose recorded at 8:04 AM" : "Morning medication recorded · shorter sleep"} /><InfoRow icon={UserRound} label="Note" value={calendar ? "Kept the afternoon quiet and drank water." : "Needed a quiet room before energy returned."} /></div>;
}

function ShareDetail({ kind }: { kind: "care-link" | "friend-link" | "report" }) {
  const [copied, setCopied] = useState(false);
  return <><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><InfoRow icon={ShieldCheck} label="Access" value={kind === "report" ? "Anyone with the link can view this read-only summary" : "Read-only · no journal edits"} /><InfoRow icon={CalendarDays} label="Included dates" value="September 1–15, 2026" /><InfoRow icon={FileHeart} label="Included details" value={kind === "friend-link" ? "Check-ins and selected notes" : "Symptoms, medication entries, sleep, and selected notes"} /></div><button type="button" onClick={() => setCopied(true)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Link ready" : "Copy read-only link"}</button><p className="mt-3 text-center text-[12px] leading-[1.4] text-purplelife-muted">The preview does not create, revoke, or copy a production sharing link.</p></>;
}

function InsightDetail() {
  return <><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-purplelife-accent">What appeared together</p><p className="mt-3 text-[16px] font-semibold leading-[1.35]">On 4 of 5 mornings after more than seven hours of sleep, your first check-in was “steady” or “okay.”</p></div><div className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><InfoRow icon={CalendarDays} label="Source" value="Five sleep entries and five morning check-ins" /><InfoRow icon={Sparkles} label="Uncertainty" value="This is a small set of entries and does not show cause" /><InfoRow icon={FileHeart} label="Next step" value="Keep recording in the same way if this feels useful" /></div></>;
}

function ConversationDetail() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  return <><div className="space-y-3"><p className="mr-10 rounded-[20px] bg-white p-4 text-[13px] leading-[1.45] shadow-sm ring-1 ring-purplelife-line">I reviewed the summary you shared. Could we talk about the afternoon entries?</p><p className="ml-10 rounded-[20px] bg-purplelife-accent p-4 text-[13px] leading-[1.45] text-white">Yes. Tuesday afternoon is the clearest example.</p>{messages.map((message, index) => <p key={index} className="ml-10 rounded-[20px] bg-purplelife-accent p-4 text-[13px] leading-[1.45] text-white">{message}</p>)}</div><div className="purplelife-glass-clear mt-5 flex items-center gap-2 rounded-[22px] p-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message" className="h-10 min-w-0 flex-1 bg-transparent px-2 text-[14px] outline-none" /><button type="button" disabled={!draft.trim()} onClick={() => { setMessages(appendLocalMessage(messages, draft)); setDraft(""); }} className="grid size-10 place-items-center rounded-full bg-purplelife-accent text-white disabled:opacity-35"><Send size={18} /></button></div><p className="mt-3 text-center text-[12px] text-purplelife-muted">Messages added here stay in this preview only.</p></>;
}

function CommunityPostDetail() {
  const [helpful, setHelpful] = useState(false);
  return <><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-purplelife-peach text-purplelife-coral"><UserRound size={19} /></span><span><span className="block text-[14px] font-semibold">QuietJournal</span><span className="block text-[11px] text-purplelife-muted">2 days ago · lived experience</span></span></div><p className="mt-5 text-[15px] leading-[1.55]">I started keeping a one-page list of the changes I noticed, the questions I want to ask, and the dates that seem most useful. It helps me stay focused without trying to explain everything at once.</p><button type="button" onClick={() => setHelpful(!helpful)} className="mt-5 flex items-center gap-2 text-[13px] font-semibold text-purplelife-accent"><Sparkles size={17} />{helpful ? "Marked helpful" : "Mark as helpful"}</button></div><a href="/community-new" className="mt-4 flex items-center gap-3 rounded-[22px] bg-purplelife-tint p-4"><MessageCircle size={20} className="text-purplelife-accent" /><span className="flex-1 text-[14px] font-semibold">Share your own experience</span><ChevronRight size={18} /></a></>;
}

function ProfileDetail() {
  return <><div className="rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line"><span className="mx-auto grid size-20 place-items-center rounded-full bg-purplelife-peach text-purplelife-coral"><UserRound size={31} /></span><h2 className="mt-4 text-[21px] font-semibold">QuietJournal</h2><p className="mt-1 text-[12px] text-purplelife-muted">Community member since 2026</p><p className="mx-auto mt-4 max-w-[280px] text-[14px] leading-[1.5]">Learning how to prepare for appointments and notice patterns without turning every day into a test.</p></div><div className="mt-4 rounded-[24px] bg-purplelife-tint p-4"><p className="flex gap-3 text-[12px] leading-[1.45] text-purplelife-muted"><LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />Private journal entries, medications, sleep, and messages never appear on a community profile.</p></div><div className="mt-4 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><div className="px-5 pb-3 pt-5"><p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-purplelife-accent">Public activity</p><h2 className="mt-1 text-[18px] font-semibold">Recent community contributions</h2></div><a href="/community/appointment-preparation" className="flex items-center gap-3 border-t border-purplelife-line px-5 py-4"><MessageCircle size={19} className="text-purplelife-accent" /><span className="flex-1"><span className="block text-[14px] font-semibold">Preparing for appointments</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">Shared 2 days ago</span></span><ChevronRight size={18} className="text-purplelife-muted" /></a><div className="flex items-center gap-3 border-t border-purplelife-line px-5 py-4"><Sparkles size={19} className="text-purplelife-coral" /><span className="flex-1"><span className="block text-[14px] font-semibold">4 helpful marks</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">Across public discussions</span></span></div></div></>;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-record-mobile-screen
 * @ployComponentType component
 * @ployComponentDescription Reusable mobile-first record detail template for PurpleLife dynamic routes.
 * @ployComponentTags purplelife mobile dynamic detail
 * @ployComponentStatus experimental
 */
export function RecordMobilePage({ kind, recordId }: RecordPageProps) {
  const copy = recordCopy[kind];
  const active = kind === "medication" ? "today" : kind === "episode" || kind === "calendar" ? "journal" : "browse";
  return <PilotAppShell active={active} landscape="detail"><DetailHeader title={copy.title} backHref={copy.backHref} /><section className="px-5 pt-1 text-center"><RecordGraphic kind={kind} /><p className="-mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">{copy.eyebrow}</p><h1 className="mx-auto mt-2 max-w-[350px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">{copy.heading}</h1><p className="mx-auto mt-3 max-w-[335px] text-[15px] leading-[1.4] text-purplelife-muted">{copy.summary}</p><p className="mt-2 text-[10px] text-purplelife-muted/70">Preview record · {recordId}</p></section><section className="mt-7 px-5">{kind === "medication" && <MedicationDetail />}{kind === "episode" && <JournalDetail />}{kind === "calendar" && <JournalDetail calendar />}{(kind === "care-link" || kind === "friend-link" || kind === "report") && <ShareDetail kind={kind} />}{kind === "sleep-insight" && <InsightDetail />}{kind === "conversation" && <ConversationDetail />}{kind === "community-post" && <CommunityPostDetail />}{kind === "profile" && <ProfileDetail />}</section></PilotAppShell>;
}
