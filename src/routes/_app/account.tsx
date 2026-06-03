import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SheetPage, SheetCard, SheetSectionLabel } from "@/components/sheet/sheet-page";
import { ProfileFields } from "@/components/account/profile-fields";
import { PasswordSection } from "@/components/account/password-section";
import { TwoFactorSection } from "@/components/account/two-factor-section";
import { LocaleFields, type LocaleValues } from "@/components/locale/locale-fields";
import { useAuth } from "@/integrations/supabase/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useTheme, type ThemeMode } from "@/lib/theme-provider";
import { setLocale, type SupportedLocale } from "@/i18n";
import { useRouteTheme } from "@/lib/use-route-theme";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { getOrCreatePersonalShareCode } from "@/lib/share-codes.functions";
import { Check, Copy, Share2 } from "lucide-react";

export const Route = createFileRoute("/_app/account")({
  head: () => ({ meta: [{ title: "Account — Purple" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { t } = useTranslation();
  // Force dark chrome so the sheet treatment looks identical in either theme.
  useRouteTheme("dark");
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const userId = session?.user?.id;
  const [locale, setLocaleState] = React.useState<LocaleValues>({
    country: null,
    timezone: null,
    locale: "en",
  });
  const [savingLocale, setSavingLocale] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("country, timezone, locale")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled || !data) return;
      setLocaleState({
        country: data.country ?? null,
        timezone: data.timezone ?? null,
        locale: (data.locale as SupportedLocale) ?? "en",
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const onLocaleChange = async (next: LocaleValues) => {
    setLocaleState(next);
    if (!userId) return;
    setSavingLocale(true);
    const { error } = await supabase
      .from("profiles")
      .update({ country: next.country, timezone: next.timezone, locale: next.locale })
      .eq("id", userId);
    setSavingLocale(false);
    if (error) return toast.error("Couldn't save region & language");
    setLocale(next.locale);
    toast.success("Saved");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/sign-in" });
  };

  return (
    <SheetPage title={t("account.title")}>
      <SheetSectionLabel>{t("account.profile")}</SheetSectionLabel>
      <SheetCard>
        <ProfileFields />
      </SheetCard>

      <SheetSectionLabel>{t("account.security")}</SheetSectionLabel>
      <SheetCard>
        <PasswordSection />
      </SheetCard>
      <SheetCard>
        <TwoFactorSection />
      </SheetCard>

      <SheetSectionLabel>{t("account.language")}</SheetSectionLabel>
      <SheetCard>
        <div className="flex items-center gap-2">
          <p className="text-[15px] text-[#FAFAFC]">{t("locale.title")}</p>
          {savingLocale && <Loader2 className="h-3 w-3 animate-spin text-white/40" />}
        </div>
        <p className="mt-1 text-[13px] sheet-muted">{t("locale.subtitle")}</p>
        <div className="mt-5 [&_label]:text-white/80 [&_input]:bg-white/[0.04] [&_input]:border-white/10 [&_input]:text-[#FAFAFC] [&_button[role=combobox]]:bg-white/[0.04] [&_button[role=combobox]]:border-white/10 [&_button[role=combobox]]:text-[#FAFAFC]">
          <LocaleFields values={locale} onChange={onLocaleChange} disabled={loading} />
        </div>
      </SheetCard>

      <SheetSectionLabel>{t("account.appearance")}</SheetSectionLabel>
      <SheetCard>
        <AppearancePicker />
      </SheetCard>

      <SheetSectionLabel>Invite</SheetSectionLabel>
      <SheetCard>
        <InviteCodeCard />
      </SheetCard>

      <SheetSectionLabel>Session</SheetSectionLabel>
      <SheetCard>
        <p className="text-[15px] text-[#FAFAFC]">Signed in as</p>
        <p className="mt-1 text-[13px] sheet-muted">{session?.user?.email ?? "—"}</p>
        <div className="mt-5">
          <Button onClick={handleSignOut} variant="outline" className="bg-white/[0.04] border-white/10 text-[#FAFAFC] hover:bg-white/10">
            {t("account.signOut")}
          </Button>
        </div>
      </SheetCard>
    </SheetPage>
  );
}

function AppearancePicker() {
  const { mode, setMode } = useTheme();
  const opts: { v: ThemeMode; label: string; desc: string }[] = [
    { v: "system", label: "System", desc: "Match device" },
    { v: "light", label: "Light", desc: "Always light" },
    { v: "dark", label: "Dark", desc: "Always dark" },
  ];
  return (
    <div>
      <p className="text-[15px] text-[#FAFAFC]">Appearance</p>
      <p className="mt-1 text-[13px] sheet-muted">Choose how Purple looks across every page.</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {opts.map((o) => {
          const active = mode === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => setMode(o.v)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                active
                  ? "border-[#B084D1] bg-[#B084D1]/15 text-[#FAFAFC]"
                  : "border-white/10 bg-white/[0.03] text-[#FAFAFC] hover:bg-white/[0.06]"
              }`}
              aria-pressed={active}
            >
              <p className="text-[15px]">{o.label}</p>
              <p className="mt-1 text-[12px] sheet-muted">{o.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}