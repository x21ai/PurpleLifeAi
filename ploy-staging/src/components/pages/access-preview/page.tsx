import { ArrowRight, KeyRound, LockKeyhole } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { PrivacyShield } from "@/components/pages/pilot/components/mobile-graphics";

/**
 * @ployComponent
 * @ployComponentId purplelife-access-preview-page
 * @ployComponentType page
 * @ployComponentDescription Focused PurpleLife sign-in and account creation preview in the approved light product system.
 * @ployComponentTags purplelife access sign-in sign-up
 * @ployComponentStatus experimental
 */
export function AccessPreviewPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const signingIn = mode === "sign-in";
  return (
    <PilotAppShell active="today" showTabs={false} landscape="focused">
      <div className="purplelife-access-layout">
      <section className="px-5 pt-5 text-center">
        <PrivacyShield className="mx-auto w-full max-w-[310px]" />
        <p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Private by default</p>
        <h1 className="mx-auto mt-2 max-w-[350px] text-[33px] font-semibold leading-[1.02] tracking-[-0.05em]">{signingIn ? "Return to your journal." : "Create your calm space."}</h1>
        <p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.45] text-purplelife-muted">{signingIn ? "Sign in to review the information you recorded and the people you chose to share with." : "Start a private journal for symptoms, medication, sleep, photos, and notes."}</p>
      </section>
      <section className="mt-8 px-5">
        <form className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line" onSubmit={(event) => event.preventDefault()}>
          <label className="block text-[13px] font-semibold" htmlFor="access-email">Email</label>
          <input id="access-email" type="email" autoComplete="email" className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 text-[14px] outline-none focus:ring-2 focus:ring-purplelife-accent/35" />
          <label className="mt-4 block text-[13px] font-semibold" htmlFor="access-password">Password</label>
          <div className="relative mt-2"><KeyRound size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purplelife-muted" /><input id="access-password" type="password" autoComplete={signingIn ? "current-password" : "new-password"} className="h-12 w-full rounded-[16px] bg-purplelife-rail pl-11 pr-4 text-[14px] outline-none focus:ring-2 focus:ring-purplelife-accent/35" /></div>
          <a href="/today" className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white">{signingIn ? "Sign in" : "Create account"}<ArrowRight size={18} /></a>
          {signingIn && <a href="/reset-password" className="mt-2 flex h-10 items-center justify-center text-[13px] font-semibold text-purplelife-accent">Preview password recovery</a>}
          <a href={signingIn ? "/sign-up" : "/sign-in"} className="mt-1 flex h-10 items-center justify-center text-[13px] font-semibold text-purplelife-muted">{signingIn ? "Create an account" : "I already have an account"}</a>
        </form>
      </section>
      <section className="mt-5 px-5"><p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.45] text-purplelife-muted"><LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />This visual preview does not create a session or submit account details.</p></section>
      </div>
    </PilotAppShell>
  );
}
