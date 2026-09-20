import { useState } from "react";
import { Check, ChevronRight, LockKeyhole, MessageCircle, Send } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { MessageBubbles } from "@/components/pages/pilot/components/mobile-graphics";

type MessageMode = "inbox" | "care";

/**
 * @ployComponent
 * @ployComponentId purplelife-messages-page
 * @ployComponentType page
 * @ployComponentDescription Private message workspace with separate inbox and caregiver framing plus local-only drafting.
 * @ployComponentTags purplelife messages care privacy
 * @ployComponentStatus experimental
 */
export function MessagesPage({ mode = "inbox" }: { mode?: MessageMode }) {
  const [tab, setTab] = useState(mode === "care" ? "Care" : "Inbox");
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const tabs = mode === "care" ? ["Care", "Drafts"] : ["Inbox", "Care", "Drafts"];
  return <PilotAppShell active="browse" landscape="insight"><DetailHeader title={mode === "care" ? "Care conversations" : "Messages"} backHref={mode === "care" ? "/care" : "/browse"} /><section className="px-5 pt-1 text-center"><MessageBubbles className="mx-auto w-full max-w-[340px]" /><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">{mode === "care" ? "Shared care" : "Private messages"}</p><h1 className="mx-auto mt-2 max-w-[380px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">{mode === "care" ? "Keep shared context in one conversation." : "Choose what to say and what to share."}</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Messages do not automatically include journal entries, reports, or measurements.</p></section><PilotLandscapeStack><section className="mt-7 px-5"><div className={`grid rounded-[18px] bg-purplelife-rail p-1 ${tabs.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>{tabs.map((item) => <button key={item} type="button" onClick={() => { setTab(item); setSaved(false); }} className={`min-h-10 rounded-[14px] text-[12px] font-semibold ${tab === item ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>{item}</button>)}</div>{tab === "Drafts" ? <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><label className="text-[12px] font-semibold text-purplelife-muted">Private draft<textarea value={draft} onChange={(event) => { setDraft(event.target.value); setSaved(false); }} placeholder="Write a message to review later" className="mt-2 min-h-28 w-full resize-none rounded-[18px] bg-purplelife-rail p-4 text-[14px] font-normal outline-none placeholder:text-purplelife-muted/60" /></label><button type="button" disabled={!draft.trim()} onClick={() => setSaved(true)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] bg-purplelife-accent text-[13px] font-semibold text-white disabled:bg-purplelife-rail disabled:text-purplelife-muted">{saved ? <Check size={17} /> : <Send size={17} />}{saved ? "Draft kept on this screen" : "Keep draft"}</button></div> : <div className="mt-4 rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line"><MessageCircle size={24} className="mx-auto text-purplelife-accent" /><p className="mt-3 text-[14px] font-semibold">No production conversations loaded</p><p className="mt-2 text-[12px] leading-[1.45] text-purplelife-muted">Cloudflare message records will appear here after access is confirmed.</p></div>}</section><section className="mt-5 px-5"><a href="/sharing" className="flex items-center gap-3 rounded-[22px] bg-purplelife-tint p-4"><LockKeyhole size={19} className="text-purplelife-accent" /><span className="flex-1"><span className="block text-[13px] font-semibold">Review sharing access</span><span className="mt-1 block text-[12px] text-purplelife-muted">Messages and read-only health access stay separate.</span></span><ChevronRight size={18} /></a></section><PilotContextPanel eyebrow="Private by default" title="A message starts with only your words." body="Journal entries, measurements, reports, and photos stay outside the conversation until you deliberately choose to include something." items={["Draft first", "Review before sending", "No automatic sharing"]} /></PilotLandscapeStack></PilotAppShell>;
}
