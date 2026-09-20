import { useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  MailCheck,
  MessageCircle,
  Pill,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { DetailHeader, Toggle } from "@/components/pages/pilot/detail/page";
import { MedicationOrbit, MessageBubbles, PrivacyShield, TrendConstellation } from "@/components/pages/pilot/components/mobile-graphics";
import { appendLocalMessage, isPasswordReady } from "@/lib/purplelife-interactions";

export type UtilityMobileKind = "med-history" | "users" | "chat" | "unsubscribe" | "thinking" | "reset-password";

type UtilityMobilePageProps = { kind: UtilityMobileKind };

function MedicationHistoryScreen() {
  const entries = [
    { day: "Today", name: "Morning dose", time: "8:04 AM", detail: "Recorded" },
    { day: "Today", name: "Afternoon dose", time: "2:11 PM", detail: "Recorded" },
    { day: "Yesterday", name: "Evening dose", time: "8:02 PM", detail: "Recorded" },
    { day: "Yesterday", name: "Morning dose", time: "7:56 AM", detail: "Recorded" },
  ];
  return <><DetailHeader title="Medication history" backHref="/meds" /><section className="px-5 pt-1 text-center"><MedicationOrbit className="mx-auto w-full max-w-[330px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Recorded doses</p><h1 className="mt-2 text-[31px] font-semibold tracking-[-0.045em]">A clear timeline of what you entered.</h1><p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.4] text-purplelife-muted">Review timing and notes without changing your medication plan.</p></section><section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{entries.map((entry, index) => <div key={`${entry.day}-${entry.name}-${index}`} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0"><span className="grid size-11 place-items-center rounded-full bg-purplelife-mint/20 text-purplelife-mint"><Check size={19} /></span><span className="flex-1"><span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-purplelife-accent">{entry.day}</span><span className="mt-0.5 block text-[15px] font-semibold">{entry.name}</span><span className="mt-0.5 block text-[12px] text-purplelife-muted">{entry.time} · {entry.detail}</span></span></div>)}</div></section><section className="mt-5 px-5"><p className="rounded-[22px] bg-purplelife-tint p-4 text-[13px] leading-[1.45] text-purplelife-muted">This history reflects entries in PurpleLife. Discuss medication changes with a qualified clinician.</p></section></>;
}

function UsersScreen() {
  const [activeOnly, setActiveOnly] = useState(true);
  return <><DetailHeader title="Users" backHref="/settings" /><section className="px-5 pt-1 text-center"><PrivacyShield className="mx-auto w-full max-w-[330px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Administration</p><h1 className="mt-2 text-[31px] font-semibold tracking-[-0.045em]">Review access without exposing health data.</h1><p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.4] text-purplelife-muted">This design state separates account administration from private journal content.</p></section><section className="mt-7 px-5"><div className="flex items-center gap-4 rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-purplelife-line"><span className="grid size-12 place-items-center rounded-[17px] bg-purplelife-tint text-purplelife-accent"><Users size={22} /></span><span className="flex-1"><span className="block text-[15px] font-semibold">Active accounts only</span><span className="mt-1 block text-[12px] text-purplelife-muted">Hide deactivated records</span></span><Toggle checked={activeOnly} onChange={() => setActiveOnly(!activeOnly)} label="Active accounts only" /></div></section><section className="mt-5 px-5"><div className="rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line"><span className="mx-auto grid size-14 place-items-center rounded-full bg-purplelife-rail text-purplelife-accent"><UserRound size={24} /></span><h2 className="mt-4 text-[19px] font-semibold">No user records in this preview</h2><p className="mt-2 text-[13px] leading-[1.4] text-purplelife-muted">Production access requires administrator permissions and a live account source.</p></div></section></>;
}

function ChatScreen() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  return <><DetailHeader title="Ask PurpleLife" backHref="/browse" /><section className="px-5 pt-1 text-center"><MessageBubbles className="mx-auto -mb-3 w-full max-w-[320px]" /><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Your journal context</p><h1 className="mx-auto mt-2 max-w-[330px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Ask about what you recorded.</h1><p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.4] text-purplelife-muted">Questions should return sourced journal details and clear uncertainty, not diagnosis or treatment advice.</p></section><section className="mt-7 space-y-3 px-5"><div className="mr-10 rounded-[22px] bg-white p-4 text-[14px] leading-[1.45] shadow-sm ring-1 ring-purplelife-line">Try asking, “What did I record on mornings after longer sleep?”</div>{messages.map((message, index) => <div key={index} className="ml-10 rounded-[22px] bg-purplelife-accent p-4 text-right text-[14px] leading-[1.45] text-white">{message}</div>)}</section><section className="mt-5 px-5"><div className="purplelife-glass-clear flex items-center gap-2 rounded-[22px] p-2"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about your journal" className="h-10 min-w-0 flex-1 bg-transparent px-2 text-[14px] outline-none" /><button type="button" aria-label="Send question" disabled={!draft.trim()} onClick={() => { setMessages(appendLocalMessage(messages, draft)); setDraft(""); }} className="grid size-10 place-items-center rounded-full bg-purplelife-accent text-white disabled:opacity-35"><Send size={18} /></button></div></section><section className="mt-4 px-5"><p className="flex gap-2 rounded-[20px] bg-purplelife-peach p-4 text-[12px] leading-[1.4] text-purplelife-muted"><Bot size={18} className="shrink-0 text-purplelife-coral" />This visual pilot does not send questions to a model or read private journal data.</p></section></>;
}

function UnsubscribeScreen() {
  const [updates, setUpdates] = useState(true);
  const [community, setCommunity] = useState(true);
  const [saved, setSaved] = useState(false);
  return <><section className="px-5 pt-7 text-center"><MessageBubbles className="mx-auto -mb-4 w-full max-w-[300px]" /><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Email preferences</p><h1 className="mx-auto mt-2 max-w-[340px] text-[32px] font-semibold leading-[1.03] tracking-[-0.045em]">Choose which messages reach you.</h1><p className="mx-auto mt-3 max-w-[325px] text-[15px] leading-[1.4] text-purplelife-muted">Journal reminders and account security messages are managed separately.</p></section><section className="mt-8 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line"><div className="flex items-center gap-4 border-b border-purplelife-line p-4"><span className="flex-1"><span className="block text-[15px] font-semibold">Product updates</span><span className="mt-1 block text-[12px] text-purplelife-muted">New PurpleLife tools and improvements</span></span><Toggle checked={updates} onChange={() => { setUpdates(!updates); setSaved(false); }} label="Product updates" /></div><div className="flex items-center gap-4 p-4"><span className="flex-1"><span className="block text-[15px] font-semibold">Community digest</span><span className="mt-1 block text-[12px] text-purplelife-muted">New discussions and resources</span></span><Toggle checked={community} onChange={() => { setCommunity(!community); setSaved(false); }} label="Community digest" /></div></div><button type="button" onClick={() => setSaved(true)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white">{saved ? <Check size={18} /> : <MailCheck size={18} />}{saved ? "Preferences saved" : "Save preferences"}</button><p className="mt-3 text-center text-[12px] leading-[1.45] text-purplelife-muted">Changes stay in this visual preview and do not update production email settings.</p><a href="/welcome" className="mt-1 flex h-11 items-center justify-center text-[13px] font-semibold text-purplelife-muted">Return to PurpleLife</a></section></>;
}

function ThinkingScreen() {
  return <><DetailHeader title="How PurpleLife thinks" backHref="/browse" /><section className="px-5 pt-4"><TrendConstellation className="w-full" /><p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Explain the connection</p><h1 className="mt-2 text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Every observation should show its source.</h1><p className="mt-3 text-[15px] leading-[1.4] text-purplelife-muted">PurpleLife can group details by time, category, and repetition. It should also explain what was included and what remains uncertain.</p></section><section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{[{ title: "Start with your entries", detail: "Use only notes, measurements, and connections you chose.", icon: Eye }, { title: "Describe, do not diagnose", detail: "Say what appeared together without assigning a medical cause.", icon: Lightbulb }, { title: "Keep you in control", detail: "Let you review, correct, hide, or share the source information.", icon: ShieldCheck }].map(({ title, detail, icon: Icon }) => <div key={title} className="flex gap-3.5 border-b border-purplelife-line p-4 last:border-b-0"><span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent"><Icon size={20} /></span><div><h2 className="text-[15px] font-semibold">{title}</h2><p className="mt-1 text-[12px] leading-snug text-purplelife-muted">{detail}</p></div></div>)}</div></section><section className="mt-5 px-5"><a href="/risk" className="flex items-center gap-4 rounded-[24px] bg-purplelife-peach p-4"><Sparkles size={21} className="text-purplelife-coral" /><span className="flex-1"><span className="block text-[14px] font-semibold">Review health context</span><span className="mt-1 block text-[12px] text-purplelife-muted">See what PurpleLife can and cannot tell you.</span></span><ChevronRight size={18} /></a></section></>;
}

function ResetPasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const ready = isPasswordReady(password, confirmed);
  return <><section className="px-5 pt-8 text-center"><PrivacyShield className="mx-auto w-full max-w-[300px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Account security</p><h1 className="mt-2 text-[32px] font-semibold tracking-[-0.045em]">Choose a new password.</h1><p className="mx-auto mt-3 max-w-[320px] text-[15px] leading-[1.4] text-purplelife-muted">A live reset also requires a valid, unexpired recovery token.</p></section><section className="mt-8 px-5"><div className="space-y-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><div><label htmlFor="new-password" className="text-[13px] font-semibold">New password</label><input id="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setReviewed(false); }} type="password" autoComplete="new-password" className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 outline-none focus:ring-2 focus:ring-purplelife-accent/35" /></div><div><label htmlFor="confirm-password" className="text-[13px] font-semibold">Confirm password</label><input id="confirm-password" value={confirmed} onChange={(event) => { setConfirmed(event.target.value); setReviewed(false); }} type="password" autoComplete="new-password" className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 outline-none focus:ring-2 focus:ring-purplelife-accent/35" /></div><button type="button" disabled={!ready} onClick={() => setReviewed(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white disabled:opacity-35"><KeyRound size={18} /> {reviewed ? "Password state reviewed" : "Review password"}</button><p className="text-[12px] leading-[1.4] text-purplelife-muted">This design state validates matching input locally. It does not change an account password.</p>{reviewed && <a href="/sign-in" className="flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-purplelife-tint text-[13px] font-semibold text-purplelife-accent">Return to sign in<ChevronRight size={17} /></a>}</div></section></>;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-utility-mobile-screens
 * @ployComponentType component
 * @ployComponentDescription Mobile PurpleLife utility screen family for medication history, users, chat, email preferences, explanatory guidance, and password recovery.
 * @ployComponentTags purplelife mobile utility account
 * @ployComponentStatus experimental
 */
export function UtilityMobilePage({ kind }: UtilityMobilePageProps) {
  const showTabs = !["unsubscribe", "reset-password"].includes(kind);
  return <PilotAppShell active={kind === "med-history" ? "today" : "browse"} showTabs={showTabs} landscape={showTabs ? "detail" : "focused"}>{kind === "med-history" && <MedicationHistoryScreen />}{kind === "users" && <UsersScreen />}{kind === "chat" && <ChatScreen />}{kind === "unsubscribe" && <UnsubscribeScreen />}{kind === "thinking" && <ThinkingScreen />}{kind === "reset-password" && <ResetPasswordScreen />}</PilotAppShell>;
}
