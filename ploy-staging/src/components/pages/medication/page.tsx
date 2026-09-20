import { useState } from "react";
import { Check, ChevronRight, Clock3, History, LockKeyhole, Pill, Plus } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { MedicationOrbit } from "@/components/pages/pilot/components/mobile-graphics";

/**
 * @ployComponent
 * @ployComponentId purplelife-medication-page
 * @ployComponentType page
 * @ployComponentDescription Medication schedule workspace with explicit empty and populated prototype states, local check-off, and cautious treatment language.
 * @ployComponentTags purplelife medication schedule journal prototype-states
 * @ployComponentStatus stable
 */
export function MedicationPage() {
  const [recorded, setRecorded] = useState(false);
  const [mode, setMode] = useState<"empty" | "sample">("empty");

  return (
    <PilotAppShell active="browse" landscape="insight">
      <DetailHeader title="Medication" backHref="/my-health" action={<a href="/capture" aria-label="Add medication" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></a>} />
      <section className="px-5 pt-1 text-center"><MedicationOrbit className="mx-auto w-full max-w-[340px]" /><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Your schedule</p><h1 className="mx-auto mt-2 max-w-[370px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Record what you took, without changing the plan.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">PurpleLife can help you remember and review. Medication decisions belong with you and a qualified clinician.</p></section>
      <PilotLandscapeStack>
        <section className="mt-7 px-5">
          <div className="mb-4 flex rounded-[18px] bg-purplelife-rail p-1"><button type="button" onClick={() => { setMode("empty"); setRecorded(false); }} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "empty" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Empty state</button><button type="button" onClick={() => { setMode("sample"); setRecorded(false); }} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold ${mode === "sample" ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>Sample schedule</button></div>
          {mode === "empty" ? (
            <div className="rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line"><Pill size={27} className="mx-auto text-purplelife-accent" /><p className="mt-3 text-[15px] font-semibold">No medication schedule loaded</p><p className="mx-auto mt-2 max-w-[290px] text-[12px] leading-[1.45] text-purplelife-muted">Add a medication record in production to review scheduled and recorded doses here.</p><a href="/capture" className="mt-5 flex min-h-11 items-center justify-center rounded-[16px] bg-purplelife-tint text-[13px] font-semibold text-purplelife-accent">Open capture preview</a></div>
          ) : (
            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><div className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-mint/20 text-purplelife-mint"><Clock3 size={20} /></span><span className="flex-1"><span className="block text-[14px] font-semibold">Morning sample</span><span className="mt-1 block text-[12px] text-purplelife-muted">8:00 AM · 1 tablet · sample record</span></span></div><button type="button" onClick={() => setRecorded(!recorded)} className={`mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] text-[13px] font-semibold ${recorded ? "bg-purplelife-mint/20 text-purplelife-mint" : "bg-purplelife-accent text-white"}`}>{recorded ? <Check size={18} /> : <Pill size={18} />}{recorded ? "Prototype dose recorded" : "Try dose check-off"}</button></div>
          )}
        </section>
        <section className="mt-5 px-5"><div className="overflow-hidden rounded-[24px] bg-purplelife-tint"><a href="/meds/history" className="flex items-center gap-3 border-b border-purplelife-accent/10 p-4"><History size={19} className="text-purplelife-accent" /><span className="flex-1 text-[13px] font-semibold">Review medication history</span><ChevronRight size={18} /></a><p className="flex gap-3 p-4 text-[12px] leading-[1.5] text-purplelife-muted"><LockKeyhole size={18} className="shrink-0 text-purplelife-accent" />This prototype does not save a dose or send a reminder.</p></div></section>
        <PilotContextPanel eyebrow="A record, not advice" title="Keep the schedule and the journal separate." body="PurpleLife can record what happened and when. Medication changes still belong in a conversation with a qualified clinician." items={["Scheduled time", "Recorded dose", "Your note"]} />
      </PilotLandscapeStack>
    </PilotAppShell>
  );
}
