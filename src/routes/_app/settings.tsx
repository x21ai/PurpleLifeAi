import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth-context";
import { OuraConnection } from "@/components/connections/oura-connection";
import { DataSection } from "@/components/settings/data-section";
import { AboutSection } from "@/components/settings/about-section";
import { useRouteTheme } from "@/lib/use-route-theme";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Purple" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  useRouteTheme("light");
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

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

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-serif text-xl text-foreground">Connections</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring your wearable data in so Purple can notice patterns across your body.
        </p>
        <div className="mt-4 divide-y divide-border">
          <OuraConnection />
        </div>
      </section>

      <DataSection />
      <AboutSection />
    </div>
  );
}