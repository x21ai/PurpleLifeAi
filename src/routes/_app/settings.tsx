import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Pill, History, Zap, Users, Shield, MessageCircle, HeartHandshake, Plane, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useIsAdmin } from "@/lib/use-is-admin";
import { useTheme, type ThemeMode } from "@/lib/theme-provider";
import { useEffect, useState, lazy, Suspense, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showsSeizureFeatures } from "@/lib/condition-prompts";

// Code-split heavy below-the-fold sections so the link list renders fast.
const OuraConnection = lazy(() =>
  import("@/components/connections/oura-connection").then((m) => ({ default: m.OuraConnection })),
);
const PhoneAlarmsSection = lazy(() =>
  import("@/components/settings/phone-alarms-section").then((m) => ({ default: m.PhoneAlarmsSection })),
);
const PreferencesSection = lazy(() =>
  import("@/components/settings/preferences-section").then((m) => ({ default: m.PreferencesSection })),
);
const DataSection = lazy(() =>
  import("@/components/settings/data-section").then((m) => ({ default: m.DataSection })),
);
const AboutSection = lazy(() =>
  import("@/components/settings/about-section").then((m) => ({ default: m.AboutSection })),
);

function SectionSkeleton() {
  return (
    <div
      className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6 h-32 animate-pulse"
      aria-hidden
    />
  );
}

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Purple" }] }),
  component: SettingsLayout,
});

function SettingsLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/settings") {
    return <Outlet />;
  }

  return <SettingsPage />;
}

function SettingsPage() {
  useRouteTheme("light");
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [conditions, setConditions] = useState<string[] | null>(null);
  useEffect(() => {
    if (!session?.user?.id) return;
    void supabase
      .from("profiles")
      .select("conditions")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setConditions((data?.conditions as string[] | null) ?? []));
  }, [session?.user?.id]);
  const showSeizure = showsSeizureFeatures(conditions);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/sign-in" });
  };

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-10 lg:px-16 pt-12 sm:pt-20 lg:pt-24 pb-24">
      <p className="label-eyebrow text-muted-foreground">Settings</p>
      <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        All in your<br/>control.
      </h1>
      <p className="mt-6 body-serif text-foreground/75 max-w-[600px]">
        Account, privacy, integrations, and how Purple talks to you.
      </p>

      <GroupLabel>Account</GroupLabel>
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Account</h2>
        {session?.user?.email && (
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="text-foreground">{session.user.email}</span>
          </p>
        )}
        <div className="mt-5">
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </section>

      <GroupLabel>Your health</GroupLabel>
      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <Row to="/meds" icon={Pill} title="Medications" subtitle="Schedules, reminders, and adherence" />
        <Row to="/reports" icon={FileText} title="Lab reports" subtitle="Upload labs as PDF or photo. See trends. Educational only." />
        {showSeizure && (
          <Row to="/seizures/new" icon={Zap} title="Past episodes" subtitle="Log seizures from any date or time" iconTone="destructive" />
        )}
      </section>

      <GroupLabel>People</GroupLabel>
      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <Row to="/settings/sharing" icon={HeartHandshake} title="Sharing & access" subtitle="Invite caregivers, set what they see, approve edits" />
        <Row to="/community" icon={Users} title="Community" subtitle="Share experiences and find resources" />
      </section>

      <GroupLabel>App</GroupLabel>
      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <Row to="/settings/travel" icon={Plane} title="Travel mode" subtitle="Plan trips, anchor doses to home time" />
      </section>

      <section className="mt-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Add past history</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Backfill old medications and past episodes so Purple can see your full story. Each form lets you pick any date.
        </p>
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <Link
            to="/meds"
            className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Pill className="h-4 w-4 text-primary" />
              <div>
                <p className="font-serif text-base text-foreground">Old medications</p>
                <p className="text-xs text-muted-foreground">Set start &amp; end dates in the past</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          {showSeizure && (
            <Link
              to="/seizures/new"
              className="flex items-center justify-between rounded-xl border border-border p-4 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-destructive" />
                <div>
                  <p className="font-serif text-base text-foreground">Past episodes</p>
                  <p className="text-xs text-muted-foreground">Log seizures from any date or time</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Connections</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring your wearable data in so Purple can notice patterns across your body.
        </p>
        <div className="mt-4 divide-y divide-border">
          <Suspense fallback={<div className="h-20 animate-pulse" aria-hidden />}>
            <OuraConnection />
          </Suspense>
        </div>
      </section>

      <AppearanceSection />
      <Suspense fallback={<SectionSkeleton />}>
        <PhoneAlarmsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <PreferencesSection />
      </Suspense>

      <GroupLabel>Data</GroupLabel>
      <Suspense fallback={<SectionSkeleton />}>
        <DataSection />
      </Suspense>

      <GroupLabel>Help</GroupLabel>
      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <Row to="/contact" icon={MessageCircle} title="Contact the team" subtitle="Questions, feedback, anything" />
      </section>
      <Suspense fallback={<SectionSkeleton />}>
        <AboutSection />
      </Suspense>

      {isAdmin && (
        <>
          <GroupLabel>Admin</GroupLabel>
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <Row to="/admin" icon={Shield} title="Admin console" subtitle="Manage users, messages, and community" iconTone="primary" />
          </section>
        </>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mt-8 mb-2 px-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </p>
  );
}

function Row({
  to,
  icon: Icon,
  title,
  subtitle,
  iconTone = "default",
}: {
  to: string;
  icon: typeof Pill;
  title: string;
  subtitle: string;
  iconTone?: "default" | "primary" | "destructive";
}) {
  const toneClass =
    iconTone === "primary"
      ? "bg-primary/10 text-primary"
      : iconTone === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-secondary text-secondary-foreground";
  return (
    <Link
      to={to as never}
      className="flex items-center justify-between p-5 sm:p-6 hover:bg-secondary/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className={`rounded-full p-2 ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-serif text-lg text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function AppearanceSection() {
  const { mode, setMode } = useTheme();
  const opts: { v: ThemeMode; label: string; desc: string }[] = [
    { v: "system", label: "System", desc: "Match device" },
    { v: "light", label: "Light", desc: "Always light" },
    { v: "dark", label: "Dark", desc: "Always dark" },
  ];
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="font-serif text-xl text-foreground">Appearance</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose how Purple looks. Applies across every page.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {opts.map((o) => {
          const active = mode === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => setMode(o.v)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background hover:bg-secondary/40 text-foreground"
              }`}
              aria-pressed={active}
            >
              <p className="font-serif text-base">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.desc}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}