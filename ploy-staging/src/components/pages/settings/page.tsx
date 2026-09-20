import { ChevronRight, Clock3, Database, Languages, LockKeyhole, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { PrivacyShield } from "@/components/pages/pilot/components/mobile-graphics";

const settings = [
  { label: "Account", detail: "Profile, language, and sign-in preferences", href: "/account", icon: UserRound, color: "bg-purplelife-tint text-purplelife-accent" },
  { label: "Privacy", detail: "Data use and health-information boundaries", href: "/settings/privacy", icon: ShieldCheck, color: "bg-purplelife-mint/20 text-purplelife-mint" },
  { label: "Sharing and access", detail: "People, links, and read-only scopes", href: "/settings/sharing", icon: UsersRound, color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { label: "Travel", detail: "Time-zone and schedule preparation", href: "/settings/travel", icon: Clock3, color: "bg-purplelife-peach text-purplelife-coral" },
  { label: "Data", detail: "Exports, imports, and account removal", href: "/data", icon: Database, color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
  { label: "How PurpleLife thinks", detail: "Observation and suggestion boundaries", href: "/settings/how-purple-thinks", icon: Languages, color: "bg-purplelife-pink/15 text-purplelife-pink" },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-settings-page
 * @ployComponentType page
 * @ployComponentDescription Settings index organized around account, privacy, sharing, travel, and data controls.
 * @ployComponentTags purplelife settings privacy account
 * @ployComponentStatus experimental
 */
export function SettingsPage() {
  return <PilotAppShell active="browse" landscape="insight"><DetailHeader title="Settings" backHref="/browse" /><section className="px-5 pt-1 text-center"><PrivacyShield className="mx-auto w-full max-w-[330px]" /><p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Your controls</p><h1 className="mx-auto mt-2 max-w-[380px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Set the boundaries around your journal.</h1><p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.45] text-purplelife-muted">Account, privacy, sharing, and data choices stay grouped by what they change.</p></section><PilotLandscapeStack><section className="mt-7 px-5"><div className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-purplelife-line">{settings.map(({ label, detail, href, icon: Icon, color }) => <a key={label} href={href} className="flex items-center gap-3.5 border-b border-purplelife-line px-4 py-4 last:border-b-0"><span className={`grid size-11 shrink-0 place-items-center rounded-[15px] ${color}`}><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{label}</span><span className="mt-1 block text-[12px] text-purplelife-muted">{detail}</span></span><ChevronRight size={18} className="text-purplelife-muted" /></a>)}</div></section><section className="mt-5 px-5"><p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted"><LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />This prototype can preview controls but does not change production account settings.</p></section><PilotContextPanel eyebrow="One place for boundaries" title="Management stays separate from your journal." body="Account, privacy, people, data, and explanation controls are grouped here and remain available from the global More menu." items={["Account", "Privacy", "People", "Data"]} /></PilotLandscapeStack></PilotAppShell>;
}
