import { useMemo, useState } from "react";
import { Activity, Check, ChevronRight, CircleHelp, RefreshCw } from "lucide-react";
import { PilotAppShell, PilotLandscapeStack } from "@/components/sections/pilot-app-shell";
import { DetailHeader } from "@/components/pages/pilot/detail/page";
import { TrendConstellation } from "@/components/pages/pilot/components/mobile-graphics";

function humanize(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @ployComponent
 * @ployComponentId purplelife-biometric-detail-page
 * @ployComponentType page
 * @ployComponentDescription Interactive light PurpleLife detail page for individual Cloudflare-backed wearable and biometric signals without fabricated readings.
 * @ployComponentTags purplelife biometrics vitals detail
 * @ployComponentStatus experimental
 */
export function BiometricDetailPage({ metric }: { metric: string }) {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "1y">("7d");
  const [compare, setCompare] = useState(false);
  const label = useMemo(() => humanize(metric), [metric]);

  return (
    <PilotAppShell active="browse" landscape="insight">
      <DetailHeader title={label} backHref="/vitals" />
      <section className="px-5 pt-2 text-center">
        <TrendConstellation className="mx-auto w-full max-w-[350px]" />
        <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">Recorded signal</p>
        <h1 className="mx-auto mt-2 max-w-[380px] text-[31px] font-semibold leading-[1.03] tracking-[-0.045em]">Review {label.toLowerCase()} in context.</h1>
        <p className="mx-auto mt-3 max-w-[350px] text-[15px] leading-[1.4] text-purplelife-muted">PurpleLife can place readings beside sleep, medication, symptoms, and notes when a supported Cloudflare connection is active.</p>
      </section>

      <PilotLandscapeStack>
      <section className="mt-7 px-5">
        <div className="flex rounded-[18px] bg-purplelife-rail p-1">
          {(["today", "7d", "30d", "1y"] as const).map((option) => <button key={option} type="button" onClick={() => setRange(option)} className={`min-h-10 flex-1 rounded-[14px] text-[12px] font-semibold transition-colors ${range === option ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted"}`}>{option}</button>)}
        </div>
        <div className="mt-4 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-[17px] bg-purplelife-tint text-purplelife-accent"><Activity size={23} /></span>
            <span className="flex-1"><span className="block text-[15px] font-semibold">No reading loaded</span><span className="mt-1 block text-[12px] text-purplelife-muted">{range} window · connect a supported source</span></span>
            <RefreshCw size={18} className="text-purplelife-muted" />
          </div>
          <div aria-label="Empty trend chart" className="mt-6 h-28 rounded-[22px] bg-[linear-gradient(to_bottom,transparent_31%,rgba(116,88,155,.12)_32%,transparent_33%,transparent_65%,rgba(116,88,155,.12)_66%,transparent_67%)] ring-1 ring-purplelife-line" />
          <button type="button" onClick={() => setCompare((value) => !value)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] bg-purplelife-rail text-[12px] font-semibold text-purplelife-accent">{compare && <Check size={16} />}{compare ? "Comparing with previous window" : "Compare with previous window"}</button>
        </div>
      </section>

      <section className="mt-5 px-5">
        <a href="/how-purple-thinks" className="flex items-center gap-3 rounded-[24px] bg-purplelife-peach p-4 text-left"><CircleHelp size={21} className="shrink-0 text-purplelife-coral" /><span className="flex-1"><span className="block text-[14px] font-semibold">How PurpleLife uses this signal</span><span className="mt-1 block text-[12px] leading-snug text-purplelife-muted">See sources, limits, and uncertainty.</span></span><ChevronRight size={18} /></a>
      </section>
      </PilotLandscapeStack>
    </PilotAppShell>
  );
}
