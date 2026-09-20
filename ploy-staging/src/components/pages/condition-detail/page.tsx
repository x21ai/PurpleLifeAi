import { useState } from "react";
import { BookOpenText, Check, ChevronRight, CircleHelp, HeartPulse, ShieldAlert, Sparkles } from "lucide-react";
import { PilotAppShell, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { WellbeingBloom } from "@/components/pages/pilot/components/mobile-graphics";

function humanize(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @ployComponent
 * @ployComponentId purplelife-condition-detail-page
 * @ployComponentType page
 * @ployComponentDescription Calm condition context page that connects a named condition to journal prompts and careful educational guidance.
 * @ployComponentTags purplelife condition health journal
 * @ployComponentStatus experimental
 */
export function ConditionDetailPage({ slug }: { slug: string }) {
  const [onList, setOnList] = useState(false);
  const condition = humanize(slug);

  return (
    <PilotAppShell active="browse" landscape="insight">
      <DetailHeader title="My health" backHref="/my-health" />
      <section className="px-5 pt-1 text-center">
        <WellbeingBloom className="mx-auto w-full max-w-[330px]" />
        <p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Health context</p>
        <h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">{condition}</h1>
        <p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Keep the notes, questions, and observations that matter to you together. PurpleLife does not diagnose or replace clinical care.</p>
      </section>

      <PilotLandscapeStack>
      <section className="mt-7 px-5">
        <button type="button" onClick={() => setOnList((value) => !value)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent px-5 text-[14px] font-semibold text-white">
          {onList ? <Check size={18} /> : <HeartPulse size={18} />}
          {onList ? "Added to My health" : "Add to My health"}
        </button>
      </section>

      <section className="mt-5 px-5">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">
          <a href="/journal/new" className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4">
            <span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent"><BookOpenText size={20} /></span>
            <span className="flex-1 text-left"><span className="block text-[15px] font-semibold">Write a condition note</span><span className="mt-1 block text-[12px] text-purplelife-muted">Record what changed, when, and what you want to remember.</span></span>
            <ChevronRight size={18} className="text-purplelife-muted" />
          </a>
          <a href={`/chat?q=${encodeURIComponent(`Help me prepare questions about ${condition}`)}`} className="flex items-center gap-3.5 px-4 py-4">
            <span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-peach text-purplelife-coral"><Sparkles size={20} /></span>
            <span className="flex-1 text-left"><span className="block text-[15px] font-semibold">Prepare questions</span><span className="mt-1 block text-[12px] text-purplelife-muted">Create a short list to review with your care team.</span></span>
            <ChevronRight size={18} className="text-purplelife-muted" />
          </a>
        </div>
      </section>

      <section className="mt-5 px-5">
        <div className="rounded-[24px] bg-purplelife-tint p-4">
          <p className="flex gap-3 text-[13px] leading-[1.5] text-purplelife-muted"><ShieldAlert size={20} className="mt-0.5 shrink-0 text-purplelife-accent" /><span><strong className="font-semibold text-purplelife-ink">What to watch for belongs with your clinician.</strong><br />If something feels urgent, contact your care team or local emergency services.</span></p>
        </div>
        <a href="/how-purple-thinks" className="mt-3 flex items-center gap-3 rounded-[22px] bg-white p-4 ring-1 ring-purplelife-line"><CircleHelp size={20} className="text-purplelife-accent" /><span className="flex-1 text-[13px] font-semibold">How PurpleLife handles health guidance</span><ChevronRight size={18} className="text-purplelife-muted" /></a>
      </section>
      </PilotLandscapeStack>
    </PilotAppShell>
  );
}
