import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { lazy, Suspense } from "react";
import { Bell, ChevronRight, ExternalLink, Plus, Smartphone, Activity } from "lucide-react";
import { SheetPage, SheetCard, SheetSectionLabel } from "@/components/sheet/sheet-page";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useTranslation } from "react-i18next";

const OuraConnection = lazy(() =>
  import("@/components/connections/oura-connection").then((m) => ({ default: m.OuraConnection })),
);
const WhoopConnection = lazy(() =>
  import("@/components/connections/whoop-connection").then((m) => ({ default: m.WhoopConnection })),
);
const PhoneAlarmsSection = lazy(() =>
  import("@/components/settings/phone-alarms-section").then((m) => ({ default: m.PhoneAlarmsSection })),
);

export const Route = createFileRoute("/_app/tools")({
  head: () => ({ meta: [{ title: "Tools — Purple" }] }),
  component: ToolsPage,
});

function ToolsPage() {
  useRouteTheme("dark");
  const { t } = useTranslation();
  return (
    <SheetPage title={t("tools.title")}>
      {/* Hero device card — mirrors Oura's ring/battery treatment */}
      <SheetCard className="overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[22px] font-light leading-tight text-[#FAFAFC]">Purple Companion</p>
            <p className="mt-1 text-[13px] sheet-muted">Phone &amp; web · This device</p>
          </div>
          <ChevronRight className="h-5 w-5 sheet-muted shrink-0" />
        </div>
        <div className="mt-6 flex flex-col items-center pb-2">
          <BatteryRing percent={87} />
          <p className="mt-5 text-[18px] font-light text-[#FAFAFC]">
            <span className="sheet-muted text-[13px] uppercase tracking-[0.18em] mr-2">Sync</span>
            Active
          </p>
          <p className="mt-2 text-[13px] sheet-muted">
            Active <span className="px-2 text-white/20">|</span> Listening
          </p>
        </div>
      </SheetCard>

      <SheetCard className="!p-0">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-white/[0.04] [&_button]:border-white/10 [&_button]:text-[#FAFAFC] [&_button]:hover:bg-white/10 [&_h2]:text-[#FAFAFC] [&_p]:text-white/70 [&_a]:text-[#82B4FF]">
            <OuraConnection />
          </div>
        </Suspense>
      </SheetCard>

      <SheetCard className="!p-0">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-white/[0.04] [&_button]:border-white/10 [&_button]:text-[#FAFAFC] [&_button]:hover:bg-white/10 [&_h2]:text-[#FAFAFC] [&_p]:text-white/70 [&_a]:text-[#82B4FF]">
            <WhoopConnection />
          </div>
        </Suspense>
      </SheetCard>

      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-[15px] text-[#82B4FF] hover:bg-white/[0.06] transition-colors"
      >
        <Plus className="h-5 w-5" />
        Set up a new device
      </button>

      <SheetSectionLabel>Notifications</SheetSectionLabel>
      <SheetCard className="!p-0">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-white/[0.04] [&_button]:border-white/10 [&_button]:text-[#FAFAFC] [&_button]:hover:bg-white/10 [&_h2]:text-[#FAFAFC] [&_h3]:text-[#FAFAFC] [&_p]:text-white/70 [&_label]:text-white/80">
            <PhoneAlarmsSection />
          </div>
        </Suspense>
      </SheetCard>

      <SheetSectionLabel>Tools &amp; utilities</SheetSectionLabel>
      <SheetCard className="!p-0">
        <div className="divide-y divide-white/5">
          <ToolRow to="/meds" icon={<Activity className="h-4 w-4" />} title="Medications" subtitle="Schedules, reminders, adherence" />
          <ToolRow to="/reports" icon={<Smartphone className="h-4 w-4" />} title="Lab reports" subtitle="Upload PDFs or photos. See trends." />
          <ToolRow to="/settings/travel" icon={<Bell className="h-4 w-4" />} title="Travel mode" subtitle="Plan trips, anchor doses to home time" />
        </div>
      </SheetCard>

      <SheetSectionLabel>Wear and care</SheetSectionLabel>
      <SheetCard className="!p-0">
        <div className="divide-y divide-white/5">
          <ExternalRow href="https://purplelife.org/how-purple-thinks" title="How Purple thinks" />
          <ExternalRow href="https://purplelife.org/privacy" title="Privacy &amp; data" />
          <ExternalRow href="https://purplelife.org/about" title="About Purple" />
        </div>
      </SheetCard>
    </SheetPage>
  );
}

function ToolRow({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to as never}
      className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7 transition-colors hover:bg-white/[0.04]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] text-[#FAFAFC]">{title}</p>
          <p className="mt-0.5 truncate text-[13px] sheet-muted">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 sheet-muted" />
    </Link>
  );
}

function ExternalRow({ href, title }: { href: string; title: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7 transition-colors hover:bg-white/[0.04]"
    >
      <p className="text-[15px] text-[#FAFAFC]" dangerouslySetInnerHTML={{ __html: title }} />
      <ExternalLink className="h-4 w-4 sheet-muted" />
    </a>
  );
}

function BatteryRing({ percent }: { percent: number }) {
  const size = 240;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(percent, 0), 100) / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#FAFAFC"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[44px] font-extralight leading-none text-[#FAFAFC] numeric">{percent}%</p>
        <p className="mt-2 text-[12px] uppercase tracking-[0.18em] sheet-muted">Battery</p>
      </div>
    </div>
  );
}