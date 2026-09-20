import { useState } from "react";
import { Check, ChevronRight, FileUp, LockKeyhole, ShieldCheck } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader, Toggle } from "@/components/pages/pilot/detail/page";
import { DnaRibbon } from "@/components/pages/pilot/components/mobile-graphics";

/**
 * @ployComponent
 * @ployComponentId purplelife-dna-page
 * @ployComponentType page
 * @ployComponentDescription Optional DNA source review with explicit consent and no health interpretation claims.
 * @ployComponentTags purplelife dna privacy consent
 * @ployComponentStatus experimental
 */
export function DnaPage() {
  const [consent, setConsent] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  return <PilotAppShell active="browse" landscape="insight"><DetailHeader title="DNA sources" backHref="/my-health" /><section className="px-5 pt-1 text-center"><DnaRibbon className="mx-auto w-full max-w-[340px]" /><p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Optional source</p><h1 className="mx-auto mt-2 max-w-[370px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">You decide whether DNA belongs in your journal.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">PurpleLife can keep a source file beside your notes. It does not interpret variants or predict conditions.</p></section><PilotLandscapeStack><section className="mt-7 px-5"><div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"><div className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-[15px] bg-purplelife-tint text-purplelife-accent"><ShieldCheck size={21} /></span><span className="flex-1"><span className="block text-[14px] font-semibold">Allow DNA source storage</span><span className="mt-1 block text-[12px] text-purplelife-muted">Required before choosing a file</span></span><Toggle checked={consent} onChange={() => { setConsent(!consent); if (consent) setSelectedFile(""); }} label="Allow DNA source storage" /></div><label className={`mt-5 flex min-h-28 flex-col items-center justify-center rounded-[22px] border border-dashed p-4 text-center ${consent ? "cursor-pointer border-purplelife-accent/35" : "border-purplelife-line bg-purplelife-rail text-purplelife-muted"}`}><FileUp size={22} /><span className="mt-2 text-[13px] font-semibold">{selectedFile || "Choose a source file"}</span><span className="mt-1 text-[11px] text-purplelife-muted">Reviewed before any production upload</span><input disabled={!consent} type="file" className="sr-only" onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? "")} /></label></div></section><section className="mt-5 px-5"><div className="overflow-hidden rounded-[24px] bg-purplelife-tint"><p className="flex gap-3 border-b border-purplelife-accent/10 p-4 text-[12px] leading-[1.5] text-purplelife-muted"><LockKeyhole size={18} className="shrink-0 text-purplelife-accent" />A selected file stays local in this visual prototype. No DNA data is uploaded or analyzed.</p><a href="/settings/privacy" className="flex items-center gap-3 p-4 text-[13px] font-semibold"><Check size={18} className="text-purplelife-accent" /><span className="flex-1">Review privacy controls</span><ChevronRight size={18} /></a></div></section><PilotContextPanel eyebrow="Consent before source" title="Optional information stays optional." body="A DNA source can sit beside your journal only after you allow it. PurpleLife does not interpret variants or predict a condition." items={["Explicit consent", "Visible source", "No prediction"]} /></PilotLandscapeStack></PilotAppShell>;
}
