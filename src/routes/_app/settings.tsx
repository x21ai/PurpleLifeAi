import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Pill, History, Zap, Users, Shield, MessageCircle, HeartHandshake, Plane, FileText, UserCircle2, Wrench, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/integrations/supabase/auth-context";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useIsAdmin } from "@/lib/use-is-admin";
import { useEffect, useState, lazy, Suspense, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showsSeizureFeatures } from "@/lib/condition-prompts";
import { useTranslation } from "react-i18next";

// Code-split heavy below-the-fold sections so the link list renders fast.
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
  const { t } = useTranslation();
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
      <p className="label-eyebrow text-muted-foreground">{t("settings.eyebrow")}</p>
      <h1 className="mt-3 font-serif text-[44px] sm:text-6xl lg:text-7xl leading-[1.02] tracking-[-0.02em] text-foreground">
        {t("settings.title1")}<br/>{t("settings.title2")}
      </h1>
      <p className="mt-6 body-serif text-foreground/75 max-w-[600px]">
        {t("settings.intro")}
      </p>

      {/* Hub: Account / Settings / Tools, like Oura's three top-level sheets. */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <HubCard to="/account" icon={UserCircle2} title={t("settings.hub.accountTitle")} subtitle={t("settings.hub.accountSubtitle")} />
        <HubCard to="/settings" icon={Settings2} title={t("settings.hub.settingsTitle")} subtitle={t("settings.hub.settingsSubtitle")} active />
        <HubCard to="/tools" icon={Wrench} title={t("settings.hub.toolsTitle")} subtitle={t("settings.hub.toolsSubtitle")} />
      </div>

      <GroupLabel>{t("settings.groups.yourHealth")}</GroupLabel>
      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <Row to="/meds" icon={Pill} title={t("settings.rows.meds")} subtitle={t("settings.rows.medsSub")} />
        <Row to="/reports" icon={FileText} title={t("settings.rows.labs")} subtitle={t("settings.rows.labsSub")} />
        {showSeizure && (
          <Row to="/seizures/new" icon={Zap} title={t("settings.rows.pastEpisodes")} subtitle={t("settings.rows.pastEpisodesSub")} iconTone="destructive" />
        )}
      </section>

      <GroupLabel>{t("settings.groups.people")}</GroupLabel>
      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <Row to="/settings/sharing" icon={HeartHandshake} title={t("settings.rows.sharing")} subtitle={t("settings.rows.sharingSub")} />
        <Row to="/community" icon={Users} title={t("settings.rows.community")} subtitle={t("settings.rows.communitySub")} />
      </section>

      <GroupLabel>{t("settings.groups.app")}</GroupLabel>
      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <Row to="/settings/travel" icon={Plane} title={t("settings.rows.travel")} subtitle={t("settings.rows.travelSub")} />
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

      <Suspense fallback={<SectionSkeleton />}>
        <PreferencesSection />
      </Suspense>

      <GroupLabel>{t("settings.groups.data")}</GroupLabel>
      <Suspense fallback={<SectionSkeleton />}>
        <DataSection />
      </Suspense>

      <GroupLabel>{t("settings.groups.help")}</GroupLabel>
      <section className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        <Row to="/contact" icon={MessageCircle} title={t("settings.rows.contact")} subtitle={t("settings.rows.contactSub")} />
      </section>
      <Suspense fallback={<SectionSkeleton />}>
        <AboutSection />
      </Suspense>

      <p className="mt-8 text-xs text-muted-foreground">{t("settings.moved")}</p>

      {isAdmin && (
        <>
          <GroupLabel>{t("settings.groups.admin")}</GroupLabel>
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <Row to="/admin" icon={Shield} title={t("settings.rows.admin")} subtitle={t("settings.rows.adminSub")} iconTone="primary" />
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

function HubCard({
  to,
  icon: Icon,
  title,
  subtitle,
  active,
}: {
  to: string;
  icon: typeof Pill;
  title: string;
  subtitle: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to as never}
      className={`flex flex-col gap-2 rounded-2xl border p-5 transition-colors ${
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-secondary/40"
      }`}
    >
      <Icon className="h-5 w-5 text-primary" />
      <p className="font-serif text-lg text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </Link>
  );
}