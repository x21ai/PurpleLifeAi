import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { lazy, Suspense } from "react";
import { Bell, ChevronRight, ExternalLink, Smartphone, Activity } from "lucide-react";
import { SheetPage, SheetCard, SheetSectionLabel } from "@/components/sheet/sheet-page";
import { useTranslation } from "react-i18next";

const OuraConnection = lazy(() =>
  import("@/components/connections/oura-connection").then((m) => ({ default: m.OuraConnection })),
);
const WhoopConnection = lazy(() =>
  import("@/components/connections/whoop-connection").then((m) => ({ default: m.WhoopConnection })),
);
const AppleHealthConnection = lazy(() =>
  import("@/components/connections/apple-health-connection").then((m) => ({
    default: m.AppleHealthConnection,
  })),
);
const PhoneAlarmsSection = lazy(() =>
  import("@/components/settings/phone-alarms-section").then((m) => ({
    default: m.PhoneAlarmsSection,
  })),
);

export const Route = createFileRoute("/_app/tools")({
  head: () => ({ meta: [{ title: "Tools · Purple" }] }),
  component: ToolsPage,
});

function ToolsPage() {
  const { t } = useTranslation();
  return (
    <SheetPage title={t("tools.title")}>
      <SheetCard className="!p-0">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 [&_h2]:text-foreground [&_p]:text-muted-foreground [&_a]:text-accent">
            <OuraConnection />
          </div>
        </Suspense>
      </SheetCard>

      <SheetCard className="!p-0">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 [&_h2]:text-foreground [&_p]:text-muted-foreground [&_a]:text-accent">
            <WhoopConnection />
          </div>
        </Suspense>
      </SheetCard>

      <SheetCard className="!p-0">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 [&_h2]:text-foreground [&_p]:text-muted-foreground [&_a]:text-accent">
            <AppleHealthConnection />
          </div>
        </Suspense>
      </SheetCard>

      <SheetSectionLabel>Notifications</SheetSectionLabel>
      <SheetCard className="!p-0">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-muted-foreground [&_label]:text-foreground/80">
            <PhoneAlarmsSection />
          </div>
        </Suspense>
      </SheetCard>

      <SheetSectionLabel>Tools &amp; utilities</SheetSectionLabel>
      <SheetCard className="!p-0">
        <div className="divide-y divide-border/60">
          <ToolRow
            to="/meds"
            icon={<Activity className="h-4 w-4" />}
            title="Medications"
            subtitle="Schedules, reminders, adherence"
          />
          <ToolRow
            to="/reports"
            icon={<Smartphone className="h-4 w-4" />}
            title="Lab reports"
            subtitle="Upload PDFs or photos. See trends."
          />
          <ToolRow
            to="/settings/travel"
            icon={<Bell className="h-4 w-4" />}
            title="Travel mode"
            subtitle="Plan trips, anchor doses to home time"
          />
        </div>
      </SheetCard>

      <SheetSectionLabel>Wear and care</SheetSectionLabel>
      <SheetCard className="!p-0">
        <div className="divide-y divide-border/60">
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
      className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7 transition-colors hover:bg-muted"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] text-foreground">{title}</p>
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
      className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7 transition-colors hover:bg-muted"
    >
      <p className="text-[15px] text-foreground" dangerouslySetInnerHTML={{ __html: title }} />
      <ExternalLink className="h-4 w-4 sheet-muted" />
    </a>
  );
}
