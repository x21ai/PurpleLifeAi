import { Activity, BookOpenText, ChevronRight, Dna, HeartPulse, LockKeyhole, MessageCircle, MessageSquareText, Search, Share2, Sparkles, Users } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { SignalOrb, WellbeingBloom } from "../components/mobile-graphics";

const categories = [
  { title: "My health", detail: "Your recorded overview", icon: HeartPulse, color: "bg-purplelife-mint/20 text-purplelife-mint", href: "/my-health" },
  { title: "Vitals", detail: "Recent measurements", icon: Activity, color: "bg-purplelife-blue/15 text-purplelife-blue", href: "/vitals" },
  { title: "Symptoms", detail: "Frequency, duration, and context", icon: Sparkles, color: "bg-purplelife-pink/15 text-purplelife-pink", href: "/insights" },
  { title: "Medication", detail: "Schedule and recorded doses", icon: HeartPulse, color: "bg-purplelife-mint/20 text-purplelife-mint", href: "/meds" },
  { title: "Sharing", detail: "Caregivers and read-only reports", icon: Share2, color: "bg-purplelife-blue/15 text-purplelife-blue", href: "/sharing" },
  { title: "Messages", detail: "Private caregiver conversations", icon: MessageCircle, color: "bg-purplelife-accent/15 text-purplelife-accent", href: "/messages" },
  { title: "DNA", detail: "Optional connected sources", icon: Dna, color: "bg-purplelife-coral/15 text-purplelife-coral", href: "/my-health-dna" },
  { title: "Privacy", detail: "Permissions and account controls", icon: LockKeyhole, color: "bg-purplelife-indigo/15 text-purplelife-indigo", href: "/settings" },
  { title: "Community", detail: "Practical questions and reflections", icon: Users, color: "bg-purplelife-pink/15 text-purplelife-pink", href: "/community" },
  { title: "Resources", detail: "Guides for using your journal", icon: BookOpenText, color: "bg-purplelife-yellow/20 text-purplelife-coral", href: "/resources" },
  { title: "Feedback", detail: "Help improve PurpleLife", icon: MessageSquareText, color: "bg-purplelife-blue/15 text-purplelife-blue", href: "/feedback" },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-pilot-browse-page
 * @ployComponentType page
 * @ployComponentDescription Mobile Browse screen with visual health summaries, focused topic cards, and a compact settings directory.
 * @ployComponentTags purplelife pilot mobile browse
 * @ployComponentStatus experimental
 */
export function PilotBrowsePage() {
  return (
    <PilotAppShell active="browse" landscape="browse">
      <header className="px-5 pt-4">
        <h1 className="text-[34px] font-semibold leading-none tracking-[-0.045em]">Browse</h1>
        <div className="purplelife-glass-clear relative mt-4 rounded-[20px]"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purplelife-muted" /><input type="search" placeholder="Search your health journal" className="h-12 w-full rounded-[20px] bg-transparent pl-11 pr-4 text-[14px] outline-none focus:ring-2 focus:ring-purplelife-accent/30" /></div>
      </header>

      <section className="mt-7 px-5">
        <h2 className="text-[22px] font-semibold tracking-[-0.035em]">Highlights</h2>
        <a href="/sleep" className="mt-3 block overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-purplelife-line">
          <SignalOrb className="mx-auto -mb-3 mt-2 w-[82%]" />
          <div className="p-5 pt-1"><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Sleep</p><h3 className="mt-2 text-[27px] font-semibold leading-[1.04] tracking-[-0.04em]">Sleep records appear here.</h3><p className="mt-3 text-[15px] leading-[1.4] text-purplelife-muted">Add bedtime, wake time, restfulness, or a note to build a source-aware history.</p></div>
        </a>
      </section>

      <section className="mt-8 px-5">
        <h2 className="text-[22px] font-semibold tracking-[-0.035em]">Explore</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <a href="/insights" className="flex min-h-[220px] flex-col rounded-[26px] bg-purplelife-tint p-3.5"><div className="overflow-hidden rounded-[20px] bg-white/70 p-2"><WellbeingBloom className="-my-3 w-full" /></div><h3 className="mt-3 text-[18px] font-semibold tracking-[-0.025em]">Patterns</h3><p className="mt-1 text-[12px] leading-snug text-purplelife-muted">See what appeared together.</p></a>
          <a href="/journal" className="flex min-h-[220px] flex-col justify-between rounded-[26px] bg-purplelife-peach p-4"><div className="grid size-12 place-items-center rounded-[17px] bg-white/70 text-purplelife-coral"><HeartPulse size={24} /></div><div><h3 className="text-[18px] font-semibold tracking-[-0.025em]">Daily details</h3><p className="mt-1 text-[12px] leading-snug text-purplelife-muted">Sleep, symptoms, notes, and photos.</p></div></a>
        </div>
      </section>

      <section className="mt-8 px-5">
        <h2 className="text-[22px] font-semibold tracking-[-0.035em]">More</h2>
        <div className="mt-3 overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
          {categories.map(({ title, detail, icon: Icon, color, href }) => (
            <a key={title} href={href} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0 active:bg-purplelife-tint"><span className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${color}`}><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{title}</span><span className="mt-0.5 block truncate text-[12px] text-purplelife-muted">{detail}</span></span><ChevronRight size={18} className="text-purplelife-muted" /></a>
          ))}
        </div>
      </section>
    </PilotAppShell>
  );
}
