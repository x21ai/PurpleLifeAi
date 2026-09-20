import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronRight,
  HeartPulse,
  LockKeyhole,
  Smartphone,
  Unlink,
  Watch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PilotAppShell, PilotContextPanel, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { SignalOrb } from "@/components/pages/pilot/components/mobile-graphics";
import { StagingBanner } from "./staging-banner";
import { isStagingLiveData } from "@/lib/staging/config";
import { ensureStagingSession } from "@/lib/staging/session";
import {
  fetchWearableConnections,
  type ConnectionState,
  type WearableConnection,
} from "@/lib/staging/tools-data";

const PROVIDER_META: Record<
  WearableConnection["id"],
  { name: string; detail: string; icon: LucideIcon; color: string }
> = {
  oura: {
    name: "Oura",
    detail: "Sleep, readiness, activity, and temperature context",
    icon: Watch,
    color: "bg-purplelife-indigo/15 text-purplelife-indigo",
  },
  whoop: {
    name: "Whoop",
    detail: "Recovery, strain, sleep, and respiratory context",
    icon: Activity,
    color: "bg-purplelife-blue/15 text-purplelife-blue",
  },
  apple: {
    name: "Apple Health",
    detail: "Health records and measurements you choose to review",
    icon: HeartPulse,
    color: "bg-purplelife-pink/15 text-purplelife-pink",
  },
};

function StatusIcon({ state }: { state: ConnectionState }) {
  if (state === "connected") return <Check size={16} />;
  if (state === "error") return <AlertTriangle size={16} />;
  return <Unlink size={16} />;
}

function statusBadgeClass(state: ConnectionState): string {
  if (state === "connected") return "bg-purplelife-mint/20 text-purplelife-mint";
  if (state === "error") return "bg-purplelife-peach text-purplelife-coral";
  return "bg-purplelife-tint text-purplelife-accent";
}

/**
 * Tools page with live Oura, Whoop, and Apple Health connection status from production D1.
 */
export function StagingLiveToolsPage() {
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [loading, setLoading] = useState(isStagingLiveData());
  const [sessionOk, setSessionOk] = useState(false);

  useEffect(() => {
    if (!isStagingLiveData()) return;
    let cancelled = false;
    (async () => {
      const ok = await ensureStagingSession();
      if (cancelled) return;
      setSessionOk(ok);
      if (!ok) {
        setLoading(false);
        return;
      }
      try {
        const rows = await fetchWearableConnections();
        if (!cancelled) setConnections(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const connectedCount = connections.filter((c) => c.state === "connected").length;

  return (
    <>
      <StagingBanner />
      <PilotAppShell active="browse" landscape="insight">
        <DetailHeader title="Tools" backHref="/browse" />
        <section className="tools-page__hero px-5 pt-1 text-center">
          <SignalOrb className="mx-auto w-full max-w-[340px]" />
          <p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">
            Connected sources
          </p>
          <h1 className="mx-auto mt-2 max-w-[390px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">
            Bring selected health context into one review.
          </h1>
          <p className="mx-auto mt-3 max-w-[360px] text-[15px] leading-[1.45] text-purplelife-muted">
            Live connection status from production token tables (read-only on staging).
          </p>
        </section>

        {isStagingLiveData() && (
          <p className="mx-5 mt-4 rounded-[14px] bg-purplelife-tint px-3 py-2 text-[12px] font-medium text-purplelife-accent">
            {loading
              ? "Connecting to production data…"
              : sessionOk
                ? `Live integrations · ${connectedCount} of 3 connected (pmt account).`
                : "Could not bootstrap staging session. Check Worker secrets."}
          </p>
        )}

        <PilotLandscapeStack>
          <section className="tools-page__connections mt-7 px-5">
            {loading && (
              <div className="rounded-[28px] bg-white p-6 text-center text-[14px] text-purplelife-muted shadow-sm ring-1 ring-purplelife-line">
                Loading connection status…
              </div>
            )}
            <div className="space-y-3">
              {(loading ? (["oura", "whoop", "apple"] as const) : connections.map((c) => c.id)).map(
                (id) => {
                  const meta = PROVIDER_META[id];
                  const conn = connections.find((c) => c.id === id);
                  const state = conn?.state ?? "disconnected";
                  const label = conn?.label ?? "Loading…";
                  const detail = conn?.detail ?? "";
                  const Icon = meta.icon;
                  return (
                    <article
                      key={id}
                      className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-purplelife-line"
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className={`grid size-12 shrink-0 place-items-center rounded-[17px] ${meta.color}`}
                        >
                          <Icon size={22} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h2 className="text-[16px] font-semibold">{meta.name}</h2>
                              <p className="mt-1 text-[12px] leading-[1.4] text-purplelife-muted">
                                {meta.detail}
                              </p>
                            </div>
                            {!loading && (
                              <span
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${statusBadgeClass(state)}`}
                              >
                                <StatusIcon state={state} />
                                {label}
                              </span>
                            )}
                          </div>
                          {!loading && (
                            <p className="mt-3 text-[11px] text-purplelife-muted">{detail}</p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          </section>

          <section className="tools-page__import mt-5 px-5">
            <a
              href="/apple-health-import"
              className="flex items-center gap-3.5 rounded-[24px] bg-purplelife-tint p-4"
            >
              <span className="grid size-11 place-items-center rounded-[15px] bg-white text-purplelife-accent">
                <Smartphone size={20} />
              </span>
              <span className="flex-1">
                <span className="block text-[14px] font-semibold">Review an Apple Health export</span>
                <span className="mt-1 block text-[12px] text-purplelife-muted">
                  Open the separate ZIP or XML import preview
                </span>
              </span>
              <ChevronRight size={18} className="text-purplelife-muted" />
            </a>
            <p className="mt-4 flex gap-3 rounded-[22px] bg-white p-4 text-[12px] leading-[1.5] text-purplelife-muted ring-1 ring-purplelife-line">
              <LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />
              OAuth connect and disconnect run on www.purplelife.org. Staging shows live token status
              only; no credentials are stored in the browser.
            </p>
          </section>

          <PilotContextPanel
            eyebrow="Source-aware by design"
            title="Keep every measurement tied to where it came from."
            body="Connection health reflects production D1 token rows: last sync, expiry, and webhook activity."
            items={["Source", "Last sync", "Token health", "Connection status"]}
          />
        </PilotLandscapeStack>
      </PilotAppShell>
    </>
  );
}
