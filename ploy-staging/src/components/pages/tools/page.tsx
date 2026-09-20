import { useState } from "react";
import { Activity, AlertTriangle, Check, ChevronRight, HeartPulse, Link2, LoaderCircle, LockKeyhole, RefreshCw, Smartphone, Unlink, Watch } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { SignalOrb } from "@/components/pages/pilot/components/mobile-graphics";

type ConnectionState = "connected" | "disconnected" | "connecting" | "error";
type ProviderId = "oura" | "whoop" | "apple";

type Provider = {
  id: ProviderId;
  name: string;
  detail: string;
  icon: LucideIcon;
  color: string;
};

const PROVIDERS: Provider[] = [
  { id: "oura", name: "Oura", detail: "Sleep, readiness, activity, and temperature context", icon: Watch, color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
  { id: "whoop", name: "Whoop", detail: "Recovery, strain, sleep, and respiratory context", icon: Activity, color: "bg-purplelife-blue/15 text-purplelife-blue" },
  { id: "apple", name: "Apple Health", detail: "Health records and measurements you choose to review", icon: HeartPulse, color: "bg-purplelife-pink/15 text-purplelife-pink" },
];

const STATUS_COPY: Record<ConnectionState, { label: string; detail: string }> = {
  connected: { label: "Connected", detail: "Sample sync completed 18 minutes ago" },
  disconnected: { label: "Not connected", detail: "No account or health data is linked" },
  connecting: { label: "Connecting", detail: "Previewing an authorization handoff" },
  error: { label: "Needs attention", detail: "The sample connection could not refresh" },
};

function StatusIcon({ state }: { state: ConnectionState }) {
  if (state === "connected") return <Check size={16} />;
  if (state === "connecting") return <LoaderCircle size={16} className="animate-spin" />;
  if (state === "error") return <AlertTriangle size={16} />;
  return <Unlink size={16} />;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-tools-page
 * @ployComponentType page
 * @ployComponentDescription Wearables and health-source prototype with independent connected, disconnected, connecting, and error states for Oura, Whoop, and Apple Health.
 * @ployComponentTags purplelife tools integrations wearables prototype
 * @ployComponentStatus stable
 */
export function ToolsPage() {
  const [states, setStates] = useState<Record<ProviderId, ConnectionState>>({
    oura: "disconnected",
    whoop: "error",
    apple: "connected",
  });

  function updateState(id: ProviderId, state: ConnectionState) {
    setStates((current) => ({ ...current, [id]: state }));
  }

  function previewConnect(id: ProviderId) {
    updateState(id, "connecting");
    window.setTimeout(() => updateState(id, "connected"), 900);
  }

  return (
    <PilotAppShell active="browse" landscape="insight">
      <DetailHeader title="Tools" backHref="/browse" />
      <section className="tools-page__hero px-5 pt-1 text-center">
        <SignalOrb className="mx-auto w-full max-w-[340px]" />
        <p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Connected sources</p>
        <h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Bring selected health context into one review.</h1>
        <p className="mx-auto mt-3 max-w-[360px] text-[15px] leading-[1.45] text-purplelife-muted">Preview how PurpleLife could connect to wearables without authorizing an account or reading production data.</p>
      </section>

      <PilotLandscapeStack>
        <section className="tools-page__connections mt-7 px-5">
          <div className="space-y-3">
            {PROVIDERS.map(({ id, name, detail, icon: Icon, color }) => {
              const state = states[id];
              const status = STATUS_COPY[state];
              return (
                <article key={id} className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-purplelife-line">
                  <div className="flex items-start gap-3.5">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-[17px] ${color}`}><Icon size={22} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div><h2 className="text-[16px] font-semibold">{name}</h2><p className="mt-1 text-[12px] leading-[1.4] text-purplelife-muted">{detail}</p></div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${state === "connected" ? "bg-purplelife-mint/20 text-purplelife-mint" : state === "error" ? "bg-purplelife-peach text-purplelife-coral" : "bg-purplelife-tint text-purplelife-accent"}`}><StatusIcon state={state} />{status.label}</span>
                      </div>
                      <p className="mt-3 text-[11px] text-purplelife-muted">{status.detail}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {state === "connected" ? (
                      <><button type="button" onClick={() => updateState(id, "disconnected")} className="min-h-11 flex-1 rounded-[16px] bg-purplelife-rail text-[12px] font-semibold text-purplelife-muted">Disconnect preview</button><button type="button" onClick={() => previewConnect(id)} className="grid size-11 place-items-center rounded-[16px] bg-purplelife-tint text-purplelife-accent" aria-label={`Refresh ${name} preview`}><RefreshCw size={17} /></button></>
                    ) : (
                      <button type="button" disabled={state === "connecting"} onClick={() => previewConnect(id)} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-purplelife-accent text-[12px] font-semibold text-white disabled:opacity-55"><Link2 size={17} />{state === "error" ? "Retry preview" : state === "connecting" ? "Connecting" : "Connect preview"}</button>
                    )}
                    {state !== "error" && <button type="button" onClick={() => updateState(id, "error")} className="min-h-11 rounded-[16px] bg-purplelife-peach px-3 text-[11px] font-semibold text-purplelife-coral">Show error</button>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="tools-page__import mt-5 px-5">
          <a href="/apple-health-import" className="flex items-center gap-3.5 rounded-[24px] bg-purplelife-tint p-4">
            <span className="grid size-11 place-items-center rounded-[15px] bg-white text-purplelife-accent"><Smartphone size={20} /></span>
            <span className="flex-1"><span className="block text-[14px] font-semibold">Review an Apple Health export</span><span className="mt-1 block text-[12px] text-purplelife-muted">Open the separate ZIP or XML import preview</span></span>
            <ChevronRight size={18} className="text-purplelife-muted" />
          </a>
          <p className="mt-4 flex gap-3 rounded-[22px] bg-white p-4 text-[12px] leading-[1.5] text-purplelife-muted ring-1 ring-purplelife-line"><LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />These controls are local UI states. They do not start OAuth, connect a device, read health data, or store credentials.</p>
        </section>

        <PilotContextPanel eyebrow="Source-aware by design" title="Keep every measurement tied to where it came from." body="A production connection should show its source, last successful sync, available categories, and any error before PurpleLife uses its data in a pattern." items={["Source", "Last sync", "Categories", "Connection health"]} />
      </PilotLandscapeStack>
    </PilotAppShell>
  );
}
