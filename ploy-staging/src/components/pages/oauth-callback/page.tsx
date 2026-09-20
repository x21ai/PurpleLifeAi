import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { PrivacyShield } from "@/components/pages/pilot/components/mobile-graphics";

type CallbackState = "checking" | "returned" | "error";

function humanize(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @ployComponent
 * @ployComponentId purplelife-oauth-callback-page
 * @ployComponentType page
 * @ployComponentDescription Provider return state for Cloudflare-backed health and account connections.
 * @ployComponentTags purplelife oauth callback connection
 * @ployComponentStatus experimental
 */
export function OAuthCallbackPage({ provider }: { provider: string }) {
  const [state, setState] = useState<CallbackState>("checking");
  const label = humanize(provider);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const failed = params.has("error") || params.has("error_description");
    const timer = window.setTimeout(() => setState(failed ? "error" : "returned"), 650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <PilotAppShell active="browse" showTabs={false} landscape="focused">
      <section className="px-5 pt-8 text-center">
        <PrivacyShield className="mx-auto w-full max-w-[310px]" />
        <p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Secure connection</p>
        <h1 className="mx-auto mt-2 max-w-[370px] text-[31px] font-semibold leading-[1.04] tracking-[-0.045em]">{state === "checking" ? `Returning from ${label}…` : state === "error" ? `${label} could not be connected.` : `${label} returned you to PurpleLife.`}</h1>
        <p className="mx-auto mt-3 max-w-[340px] text-[15px] leading-[1.45] text-purplelife-muted">{state === "checking" ? "Checking the return information in this browser." : state === "error" ? "No health information was added. You can try the connection again from Tools." : "The Cloudflare service completes supported connection checks. This visual prototype does not exchange or store provider tokens."}</p>
      </section>
      <section className="mt-8 px-5">
        <div className="rounded-[28px] bg-white p-5 text-center shadow-sm ring-1 ring-purplelife-line">
          <span className={`mx-auto grid size-14 place-items-center rounded-full ${state === "error" ? "bg-purplelife-peach text-purplelife-coral" : "bg-purplelife-tint text-purplelife-accent"}`}>
            {state === "checking" ? <LoaderCircle size={24} className="animate-spin" /> : state === "error" ? <AlertCircle size={24} /> : <Check size={24} />}
          </span>
          <p className="mt-4 text-[14px] font-semibold">{state === "checking" ? "Checking return state" : state === "error" ? "Connection not completed" : "Return received"}</p>
          <p className="mt-2 text-[12px] leading-[1.45] text-purplelife-muted">PurpleLife never asks you to paste provider passwords or access codes into this page.</p>
        </div>
        <a href="/tools" className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white">Review connections <ArrowRight size={18} /></a>
      </section>
      <section className="mt-5 px-5"><p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.5] text-purplelife-muted"><ShieldCheck size={19} className="shrink-0 text-purplelife-accent" />Connection permissions remain controlled by the provider and your PurpleLife settings.</p></section>
    </PilotAppShell>
  );
}
