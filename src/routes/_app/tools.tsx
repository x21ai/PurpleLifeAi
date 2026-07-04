import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { lazy, Suspense } from "react";
import { Bell, ChevronRight, Plus, Smartphone, Activity, Watch, Heart, Apple } from "lucide-react";
import { SheetPage, SheetCard, SheetSectionLabel } from "@/components/sheet/sheet-page";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { isNativeApp } from "@/lib/native";

const OuraConnection = lazy(() =>
  import("@/components/connections/oura-connection").then((m) => ({ default: m.OuraConnection })),
);
const WhoopConnection = lazy(() =>
  import("@/components/connections/whoop-connection").then((m) => ({ default: m.WhoopConnection })),
);
const AppleHealthConnection = lazy(() =>
  import("@/components/connections/apple-health-connection").then((m) => ({ default: m.AppleHealthConnection })),
);
const PhoneAlarmsSection = lazy(() =>
  import("@/components/settings/phone-alarms-section").then((m) => ({ default: m.PhoneAlarmsSection })),
);
const NativeNotificationsPanel = lazy(() =>
  import("@/components/settings/native-notifications-panel").then((m) => ({
    default: m.NativeNotificationsPanel,
  })),
);

export const Route = createFileRoute("/_app/tools")({
  head: () => ({ meta: [{ title: "Tools · Purple" }] }),
  component: ToolsPage,
});

function ToolsPage() {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const scrollToCard = (id: string) => {
    setPickerOpen(false);
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("ring-2", "ring-accent");
      setTimeout(() => el.classList.remove("ring-2", "ring-accent"), 1600);
    });
  };

  return (
    <SheetPage title={t("tools.title")}>
      <SheetCard id="device-oura" className="!p-0 transition-shadow">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 [&_h2]:text-foreground [&_p]:text-muted-foreground [&_a]:text-accent">
            <OuraConnection />
          </div>
        </Suspense>
      </SheetCard>

      <SheetCard id="device-whoop" className="!p-0 transition-shadow">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 [&_h2]:text-foreground [&_p]:text-muted-foreground [&_a]:text-accent">
            <WhoopConnection />
          </div>
        </Suspense>
      </SheetCard>

      <SheetCard id="device-apple-health" className="!p-0 transition-shadow">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 [&_h2]:text-foreground [&_p]:text-muted-foreground [&_a]:text-accent">
            <AppleHealthConnection />
          </div>
        </Suspense>
      </SheetCard>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/60 p-5 text-[15px] text-white hover:bg-muted transition-colors"
      >
        <Plus className="h-5 w-5" />
        Set up a new device
      </button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set up a new device</DialogTitle>
            <DialogDescription>
              Choose a device or app to connect. Purple supports these today.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2">
            <DevicePickerRow
              icon={<Watch className="h-5 w-5" />}
              title="Oura Ring"
              subtitle="Sleep, readiness, HRV"
              onClick={() => scrollToCard("device-oura")}
            />
            <DevicePickerRow
              icon={<Heart className="h-5 w-5" />}
              title="Whoop"
              subtitle="Recovery, strain, sleep"
              onClick={() => scrollToCard("device-whoop")}
            />
            <DevicePickerRow
              icon={<Apple className="h-5 w-5" />}
              title="Apple Health"
              subtitle="Steps, heart rate, workouts"
              onClick={() => scrollToCard("device-apple-health")}
            />
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            More devices are on the way. Email{" "}
            <a className="text-accent underline" href="mailto:hello@purplelife.org">
              hello@purplelife.org
            </a>{" "}
            to request one.
          </p>
        </DialogContent>
      </Dialog>

      <SheetSectionLabel>Notifications</SheetSectionLabel>
      <SheetCard className="!p-0">
        <Suspense fallback={<div className="h-24 animate-pulse" aria-hidden />}>
          <div className="p-5 sm:p-7 [&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-muted-foreground [&_label]:text-foreground/80">
            {isNativeApp() ? <NativeNotificationsPanel /> : <PhoneAlarmsSection />}
          </div>
        </Suspense>
      </SheetCard>

      <SheetSectionLabel>Tools &amp; utilities</SheetSectionLabel>
      <SheetCard className="!p-0">
        <div className="divide-y divide-border/60">
          <ToolRow to="/meds" icon={<Activity className="h-4 w-4" />} title="Medications" subtitle="Schedules, reminders, adherence" />
          <ToolRow to="/reports" icon={<Smartphone className="h-4 w-4" />} title="Lab reports" subtitle="Upload PDFs or photos. See trends." />
          <ToolRow to="/settings/travel" icon={<Bell className="h-4 w-4" />} title="Travel mode" subtitle="Plan trips, anchor doses to home time" />
        </div>
      </SheetCard>

      <SheetSectionLabel>Wear and care</SheetSectionLabel>
      <SheetCard className="!p-0">
        <div className="divide-y divide-border/60">
          <InternalRow to="/settings/how-purple-thinks" title="How Purple thinks" />
          <InternalRow
            to={isNativeApp() ? "/settings/privacy" : "/privacy"}
            title="Privacy &amp; data"
          />
          {isNativeApp() ? (
            <InternalRow to="/settings/terms" title="Terms" />
          ) : (
            <InternalRow to="/about" title="About Purple" />
          )}
        </div>
      </SheetCard>
    </SheetPage>
  );
}

function DevicePickerRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] text-foreground">{title}</p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
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

function InternalRow({ to, title }: { to: string; title: string }) {
  return (
    <Link
      to={to as never}
      className="flex items-center justify-between gap-4 px-5 py-4 sm:px-7 transition-colors hover:bg-muted"
    >
      <p className="text-[15px] text-foreground" dangerouslySetInnerHTML={{ __html: title }} />
      <ChevronRight className="h-4 w-4 sheet-muted" />
    </Link>
  );
}
