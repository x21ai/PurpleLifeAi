import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  HeartHandshake,
  Lightbulb,
  LockKeyhole,
  MessageCircle,
  NotebookPen,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { submitForm } from "@/lib/ploy-forms/submit-form";
import { hasInvitationToken, isFeedbackReady } from "@/lib/purplelife-interactions";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import {
  CaptureHalo,
  JournalRibbon,
  MessageBubbles,
  SharingRings,
} from "@/components/pages/pilot/components/mobile-graphics";

export type SocialSupportKind =
  | "community"
  | "new-post"
  | "resources"
  | "feedback"
  | "welcome"
  | "care-invite"
  | "friend-invite"
  | "friend-join";

type SocialSupportPageProps = {
  kind: SocialSupportKind;
};

const previewPosts = [
  { topic: "Daily journaling", text: "Keeping each note brief made it easier for me to capture the whole week.", replies: "4 replies", color: "bg-purplelife-pink/15 text-purplelife-pink", href: "/community/appointment-preparation" },
  { topic: "Preparing to share", text: "What do you include when you send a weekly summary to someone who helps with care?", replies: "7 replies", color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { topic: "Medication notes", text: "I started recording context with each dose instead of trying to remember it later.", replies: "3 replies", color: "bg-purplelife-mint/20 text-purplelife-mint" },
];

function CommunityScreen() {
  return (
    <>
      <DetailHeader title="Community" backHref="/browse" action={<a href="/community-new" aria-label="Create post" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></a>} />
      <section className="px-5 pt-1 text-center"><MessageBubbles className="mx-auto w-full max-w-[345px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Community preview</p><h1 className="mx-auto mt-2 max-w-[330px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Compare notes without comparing lives.</h1><p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.4] text-purplelife-muted">Ask practical questions, share what helped you stay organized, and keep personal health details private.</p></section>
      <section className="mt-7 px-5"><div className="flex items-center justify-between"><h2 className="text-[21px] font-semibold tracking-[-0.035em]">Recent discussions</h2><a href="/community/resources" className="text-[13px] font-semibold text-purplelife-accent">Resources</a></div><div className="mt-3 space-y-3">{previewPosts.map((post) => { const content = <><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${post.color}`}>{post.topic}</span><p className="mt-3 text-[15px] font-semibold leading-[1.35]">{post.text}</p><span className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-purplelife-muted"><MessageCircle size={14} /> {post.replies}</span></>; return post.href ? <a key={post.topic} href={post.href} className="block w-full rounded-[26px] bg-white p-4 text-left shadow-sm ring-1 ring-purplelife-line active:bg-purplelife-tint">{content}</a> : <article key={post.topic} className="w-full rounded-[26px] bg-white p-4 text-left shadow-sm ring-1 ring-purplelife-line">{content}</article>; })}</div></section>
      <section className="mt-5 px-5"><div className="flex gap-3 rounded-[24px] bg-purplelife-tint p-4"><ShieldCheck size={21} className="mt-0.5 shrink-0 text-purplelife-accent" /><p className="text-[13px] leading-[1.4] text-purplelife-muted">Community posts should not include identifying health records, contact details, or requests for medical diagnosis.</p></div></section>
    </>
  );
}

function NewPostScreen() {
  const [draft, setDraft] = useState("");
  const [reviewing, setReviewing] = useState(false);
  return (
    <>
      <DetailHeader title="New community post" backHref="/community" />
      <section className="px-5 pt-3 text-center"><CaptureHalo className="mx-auto -mb-3 w-full max-w-[300px]" /><h1 className="mx-auto max-w-[330px] text-[30px] font-semibold leading-[1.04] tracking-[-0.045em]">Share a practical question or reflection.</h1><p className="mx-auto mt-3 max-w-[330px] text-[14px] leading-[1.4] text-purplelife-muted">Leave out names, contact details, and anything from your private journal that you do not want public.</p></section>
      <section className="mt-7 px-5"><label className="text-[13px] font-semibold" htmlFor="community-draft">Your post</label><textarea id="community-draft" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="What would you like to ask or share?" className="mt-2 min-h-40 w-full resize-none rounded-[26px] bg-white p-4 text-[15px] leading-[1.45] outline-none ring-1 ring-purplelife-line focus:ring-2 focus:ring-purplelife-accent/35" /><button type="button" disabled={!draft.trim()} onClick={() => setReviewing(true)} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white disabled:opacity-35"><ArrowRight size={18} /> Review post</button></section>
      {reviewing && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-purplelife-ink/10 p-3 backdrop-blur-md" role="presentation" onMouseDown={() => setReviewing(false)}><div role="dialog" aria-modal="true" aria-label="Review community post" onMouseDown={(event) => event.stopPropagation()} className="purplelife-glass-sheet w-full max-w-[402px] rounded-[34px] p-5"><div className="flex justify-between gap-4"><div><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Draft preview</p><h2 className="mt-1 text-[23px] font-semibold tracking-[-0.03em]">Review before sharing</h2></div><button type="button" onClick={() => setReviewing(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-purplelife-rail"><X size={18} /></button></div><p className="mt-5 rounded-[20px] bg-white/70 p-4 text-[14px] leading-[1.45] ring-1 ring-white">{draft}</p><p className="mt-4 text-[12px] leading-[1.4] text-purplelife-muted">This design pilot does not publish community content.</p></div></div>}
    </>
  );
}

const resourceItems = [
  { title: "Prepare for an appointment", detail: "Choose journal details you want to discuss.", href: "/journal", icon: NotebookPen, color: "bg-purplelife-pink/15 text-purplelife-pink" },
  { title: "Share a weekly summary", detail: "Review scopes before sending read-only access.", href: "/sharing", icon: HeartHandshake, color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { title: "Keep medication notes clear", detail: "Record timing and context without changing care.", href: "/meds", icon: Sparkles, color: "bg-purplelife-mint/20 text-purplelife-mint" },
  { title: "Protect personal information", detail: "Know what belongs in private journal entries.", href: "/settings/privacy", icon: LockKeyhole, color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
];

function ResourcesScreen() {
  return (
    <>
      <DetailHeader title="Resources" backHref="/community" />
      <section className="px-5 pt-2"><JournalRibbon className="w-full" /><p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">PurpleLife guides</p><h1 className="mt-2 text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Practical help for using your journal.</h1><p className="mt-3 max-w-[340px] text-[15px] leading-[1.4] text-purplelife-muted">Short guides for capturing, reviewing, and sharing health information carefully.</p></section>
      <section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{resourceItems.map(({ title, detail, href, icon: Icon, color }) => <a key={title} href={href} className="flex w-full items-center gap-3.5 border-b border-purplelife-line px-4 py-4 text-left last:border-b-0 active:bg-purplelife-tint"><span className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${color}`}><Icon size={20} /></span><span className="flex-1"><span className="block text-[15px] font-semibold">{title}</span><span className="mt-0.5 block text-[12px] leading-snug text-purplelife-muted">{detail}</span></span><ChevronRight size={18} className="text-purplelife-muted" /></a>)}</div></section>
      <section className="mt-5 px-5"><div className="rounded-[24px] bg-purplelife-peach p-4"><p className="text-[13px] leading-[1.45] text-purplelife-muted">These guides support organization and communication. They do not replace advice from a qualified clinician.</p></div></section>
    </>
  );
}

function FeedbackScreen() {
  const [status, setStatus] = useState<"idle" | "invalid" | "sending" | "sent" | "error">("idle");
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    if (!isFeedbackReady(data.message ?? "")) {
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    try {
      await submitForm("PurpleLife product feedback", data);
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }
  return (
    <>
      <DetailHeader title="Feedback" backHref="/settings" />
      <section className="px-5 pt-2 text-center"><MessageBubbles className="mx-auto -mb-3 w-full max-w-[320px]" /><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Help improve PurpleLife</p><h1 className="mx-auto mt-2 max-w-[330px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Tell us what worked and what did not.</h1><p className="mx-auto mt-3 max-w-[325px] text-[15px] leading-[1.4] text-purplelife-muted">Please leave private health information out of product feedback.</p></section>
      <section className="mt-7 px-5"><form onSubmit={handleSubmit} className="space-y-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><div><label htmlFor="feedback-type" className="text-[13px] font-semibold">Feedback type</label><select id="feedback-type" name="type" required className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 text-[14px] outline-none"><option value="idea">Idea</option><option value="confusing">Something was confusing</option><option value="problem">Something did not work</option></select></div><div><label htmlFor="feedback-message" className="text-[13px] font-semibold">What would you like us to know?</label><textarea id="feedback-message" name="message" required className="mt-2 min-h-32 w-full resize-none rounded-[18px] bg-purplelife-rail p-4 text-[14px] outline-none focus:ring-2 focus:ring-purplelife-accent/35" /></div><div><label htmlFor="feedback-email" className="text-[13px] font-semibold">Email for a reply <span className="font-normal text-purplelife-muted">optional</span></label><input id="feedback-email" name="email" type="email" className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 text-[14px] outline-none focus:ring-2 focus:ring-purplelife-accent/35" /></div><button type="submit" disabled={status === "sending"} className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white disabled:opacity-55"><Send size={18} /> {status === "sending" ? "Sending" : "Send feedback"}</button>{status === "sent" && <p role="status" className="text-center text-[13px] font-semibold text-purplelife-accent">Thank you. Your feedback was sent.</p>}{status === "invalid" && <p role="alert" className="text-center text-[13px] font-semibold text-purplelife-coral">Add a little more detail before sending.</p>}{status === "error" && <p role="alert" className="text-center text-[13px] font-semibold text-purplelife-coral">Your feedback could not be sent. Please try again.</p>}</form></section>
    </>
  );
}

function WelcomeScreen() {
  return (
    <>
      <section className="px-5 pt-5 text-center"><JournalRibbon className="mx-auto w-full max-w-[350px]" /><p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Welcome to PurpleLife</p><h1 className="mx-auto mt-2 max-w-[350px] text-[33px] font-semibold leading-[1.02] tracking-[-0.05em]">A calm place to capture what is happening today.</h1><p className="mx-auto mt-4 max-w-[330px] text-[15px] leading-[1.45] text-purplelife-muted">Start with one note. PurpleLife can help you keep symptoms, medication, sleep, photos, and context together.</p></section>
      <section className="mt-8 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{[{ title: "Capture privately", detail: "Your journal starts visible only to you.", icon: LockKeyhole }, { title: "Notice what you recorded", detail: "Review timing and details without diagnosis.", icon: Lightbulb }, { title: "Share by choice", detail: "Give selected read-only access when it helps.", icon: HeartHandshake }].map(({ title, detail, icon: Icon }, index) => <div key={title} className="flex gap-3.5 border-b border-purplelife-line p-4 last:border-b-0"><span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent"><Icon size={20} /></span><div><p className="text-[11px] font-semibold text-purplelife-accent">0{index + 1}</p><h2 className="text-[15px] font-semibold">{title}</h2><p className="mt-1 text-[12px] leading-snug text-purplelife-muted">{detail}</p></div></div>)}</div><a href="/today" className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-[19px] bg-purplelife-accent text-[15px] font-semibold text-white">Open Today <ArrowRight size={18} /></a></section>
    </>
  );
}

function InvitationScreen({ kind }: { kind: "care-invite" | "friend-invite" | "friend-join" }) {
  const [accepted, setAccepted] = useState(false);
  const [missingToken, setMissingToken] = useState(false);
  const caregiver = kind === "care-invite";
  const joining = kind === "friend-join";
  const title = caregiver ? "Caregiver invitation" : joining ? "Join a shared circle" : "Friend invitation";
  return (
    <>
      <section className="px-5 pt-4 text-center"><SharingRings className="mx-auto w-full max-w-[350px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">{title}</p><h1 className="mx-auto mt-2 max-w-[340px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">{accepted ? "You are connected." : caregiver ? "Review what you are being invited to view." : "Connect without opening the whole journal."}</h1><p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.4] text-purplelife-muted">{accepted ? "You can review or leave this connection from Sharing." : "An invitation should state who sent it, what is shared, and whether access is read-only before you accept."}</p></section>
      {!accepted ? <section className="mt-7 px-5"><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-full bg-purplelife-tint text-purplelife-accent"><Users size={22} /></span><div><h2 className="text-[15px] font-semibold">Invitation preview</h2><p className="mt-1 text-[12px] text-purplelife-muted">Sender details appear when a valid invite is loaded.</p></div></div><div className="mt-5 space-y-3 rounded-[20px] bg-purplelife-rail p-4"><p className="flex items-center gap-2 text-[13px]"><Check size={17} className="text-purplelife-mint" /> Selected information only</p><p className="flex items-center gap-2 text-[13px]"><Check size={17} className="text-purplelife-mint" /> Read-only access</p><p className="flex items-center gap-2 text-[13px]"><Check size={17} className="text-purplelife-mint" /> Removable at any time</p></div><button type="button" onClick={() => { if (hasInvitationToken(window.location.search)) { setAccepted(true); setMissingToken(false); } else { setMissingToken(true); } }} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white"><HeartHandshake size={18} />Accept invitation</button>{missingToken && <p role="alert" className="mt-3 text-center text-[12px] font-semibold text-purplelife-coral">A valid invitation token is required before this connection can be accepted.</p>}<a href="/welcome" className="mt-3 flex h-11 w-full items-center justify-center text-[13px] font-semibold text-purplelife-muted">Not now</a></div></section> : <section className="mt-7 px-5"><div className="rounded-[28px] bg-purplelife-tint p-5 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-white text-purplelife-accent"><Check size={26} /></span><h2 className="mt-4 text-[20px] font-semibold">Connection ready</h2><a href="/sharing" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white">Review Sharing <ArrowRight size={18} /></a></div></section>}
      <section className="mt-5 px-5"><div className="flex gap-3 rounded-[24px] bg-purplelife-peach p-4"><CircleHelp size={21} className="mt-0.5 shrink-0 text-purplelife-coral" /><p className="text-[13px] leading-[1.4] text-purplelife-muted">This visual state does not validate or accept a live invitation without the required runtime token.</p></div></section>
    </>
  );
}

/**
 * @ployComponent
 * @ployComponentId purplelife-social-support-page
 * @ployComponentType page
 * @ployComponentDescription Shared mobile-first PurpleLife page family for community, resources, feedback, welcome, and invitation experiences.
 * @ployComponentTags purplelife mobile community resources feedback invitations
 * @ployComponentStatus experimental
 */
export function SocialSupportPage({ kind }: SocialSupportPageProps) {
  const showTabs = !["welcome", "care-invite", "friend-invite", "friend-join"].includes(kind);
  return (
    <PilotAppShell active="browse" showTabs={showTabs} landscape={showTabs ? "detail" : "focused"}>
      {kind === "community" && <CommunityScreen />}
      {kind === "new-post" && <NewPostScreen />}
      {kind === "resources" && <ResourcesScreen />}
      {kind === "feedback" && <FeedbackScreen />}
      {kind === "welcome" && <WelcomeScreen />}
      {kind === "care-invite" && <InvitationScreen kind="care-invite" />}
      {kind === "friend-invite" && <InvitationScreen kind="friend-invite" />}
      {kind === "friend-join" && <InvitationScreen kind="friend-join" />}
    </PilotAppShell>
  );
}
