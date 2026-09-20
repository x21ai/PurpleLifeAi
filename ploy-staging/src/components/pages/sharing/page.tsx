import { useState } from "react";
import { ChevronRight, FileHeart, Link2, LockKeyhole, Plus, UsersRound } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { SharingRings } from "@/components/pages/pilot/components/mobile-graphics";

/**
 * @ployComponent
 * @ployComponentId purplelife-sharing-page
 * @ployComponentType page
 * @ployComponentDescription Read-only sharing control center separated into people, links, and reports.
 * @ployComponentTags purplelife sharing privacy caregivers
 * @ployComponentStatus experimental
 */
export function SharingPage() {
  const [tab, setTab] = useState("People");
  const tabDetails: Record<string, [string, string, string]> = {
    People: ["No people have access in this prototype", "Invite a caregiver or friend, then choose exactly what they can read.", "/care"],
    Links: ["No active share links loaded", "Read-only links can be scoped and removed without exposing the rest of your journal.", "/reports"],
    Reports: ["No shared reports loaded", "Prepare a report, review every section, then decide whether to create a link.", "/reports/new"],
  };
  const [heading, detail, href] = tabDetails[tab];
  return <PilotAppShell active="browse" landscape="insight"><DetailHeader title="Sharing" backHref="/settings" action={<a href="/care" aria-label="Invite someone" className="purplelife-glass-clear grid size-10 place-items-center rounded-full text-purplelife-accent"><Plus size={20} /></a>} /><section className="px-5 pt-1 text-center"><SharingRings className="mx-auto w-full max-w-[340px]" /><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Read-only by default</p><h1 className="mx-auto mt-2 max-w-[370px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Share a small window, not your whole journal.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Choose the person, information, and duration. You can remove access later.</p></section><PilotLandscapeStack><section className="mt-7 px-5"><div className="grid grid-cols-3 rounded-[18px] bg-purplelife-rail p-1">{["People", "Links", "Reports"].map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-10 rounded-[14px] text-[12px] font-semibold ${tab === item ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>{item}</button>)}</div><div className="mt-4 rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-purplelife-line">{tab === "People" ? <UsersRound size={25} className="mx-auto text-purplelife-accent" /> : tab === "Links" ? <Link2 size={25} className="mx-auto text-purplelife-accent" /> : <FileHeart size={25} className="mx-auto text-purplelife-accent" />}<p className="mt-3 text-[14px] font-semibold">{heading}</p><p className="mt-2 text-[12px] leading-[1.45] text-purplelife-muted">{detail}</p><a href={href} className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-purplelife-accent text-[13px] font-semibold text-white">Open {tab.toLowerCase()} setup<ChevronRight size={17} /></a></div></section><section className="mt-5 px-5"><p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted"><LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />Sharing stays read-only. This visual prototype does not create invitations, tokens, or public links.</p></section><PilotContextPanel eyebrow="Boundaries stay visible" title="Every share has a clear edge." body="PurpleLife separates people, links, and reports so you can review exactly what another person can open and remove access later." items={["Read-only", "Selected details", "Removable access"]} /></PilotLandscapeStack></PilotAppShell>;
}
