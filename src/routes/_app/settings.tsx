import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Pill, History, Zap, Users, Shield, MessageCircle, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth-context";
import { OuraConnection } from "@/components/connections/oura-connection";
import { DataSection } from "@/components/settings/data-section";
import { AboutSection } from "@/components/settings/about-section";
import { PreferencesSection } from "@/components/settings/preferences-section";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useIsAdmin } from "@/lib/use-is-admin";
import { useTheme, type ThemeMode } from "@/lib/theme-provider";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Purple" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  useRouteTheme("light");
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

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

      <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
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

      <section className="mt-6 rounded-2xl border border-border bg-card overflow-hidden">
        <Link
          to="/meds"
          className="flex items-center justify-between p-5 sm:p-6 hover:bg-secondary/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-secondary p-2 text-secondary-foreground">
              <Pill className="h-4 w-4" />
            </span>
            <div>
              <p className="font-serif text-lg text-foreground">Medications</p>
              <p className="text-xs text-muted-foreground">Schedules, reminders, and adherence</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <Link to="/settings/sharing" className="flex items-center justify-between p-5 sm:p-6 hover:bg-secondary/40 transition-colors">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-secondary p-2 text-secondary-foreground">
              <HeartHandshake className="h-4 w-4" />
            </span>
            <div>
              <p className="font-serif text-lg text-foreground">Sharing &amp; access</p>
              <p className="text-xs text-muted-foreground">Invite caregivers, set what they can see, approve any edits</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/community" className="flex items-center justify-between p-5 sm:p-6 hover:bg-secondary/40 transition-colors">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-secondary p-2 text-secondary-foreground">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="font-serif text-lg text-foreground">Community</p>
              <p className="text-xs text-muted-foreground">Share experiences and find resources</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link to="/contact" className="flex items-center justify-between p-5 sm:p-6 hover:bg-secondary/40 transition-colors">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-secondary p-2 text-secondary-foreground">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="font-serif text-lg text-foreground">Contact the team</p>
              <p className="text-xs text-muted-foreground">Questions, feedback, anything</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        {isAdmin && (
          <Link to="/admin" className="flex items-center justify-between p-5 sm:p-6 hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <Shield className="h-4 w-4" />
              </span>
              <div>
                <p className="font-serif text-lg text-foreground">Admin console</p>
                <p className="text-xs text-muted-foreground">Manage users, messages, and community</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
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
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Connections</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring your wearable data in so Purple can notice patterns across your body.
        </p>
        <div className="mt-4 divide-y divide-border">
          <OuraConnection />
        </div>
      </section>

      <AppearanceSection />
      <PreferencesSection />
      <DataSection />
      <AboutSection />
    </div>
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