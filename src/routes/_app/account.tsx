import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SheetPage, SheetCard, SheetSectionLabel } from "@/components/sheet/sheet-page";
import { ProfileFields } from "@/components/account/profile-fields";
import { AvatarCard } from "@/components/account/avatar-card";
import { PasswordSection } from "@/components/account/password-section";
import { TwoFactorSection } from "@/components/account/two-factor-section";
import { LocaleFields, type LocaleValues } from "@/components/locale/locale-fields";
import { useAuth } from "@/integrations/supabase/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useTheme, type ThemeMode } from "@/lib/theme-provider";
import { setLocale, type SupportedLocale } from "@/i18n";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { getOrCreatePersonalShareCode } from "@/lib/share-codes.functions";
import { Check, Copy, Share2 } from "lucide-react";

export const Route = createFileRoute("/_app/account")({
  head: () => ({ meta: [{ title: "Account · Purple" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { t } = useTranslation();
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
        <AvatarCard />
      </SheetCard>
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
          <p className="text-[15px] text-foreground">{t("locale.title")}</p>
          {savingLocale && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <p className="mt-1 text-[13px] sheet-muted">{t("locale.subtitle")}</p>
        <div className="mt-5 [&_label]:text-foreground/80 [&_input]:bg-muted [&_input]:border-border [&_input]:text-foreground [&_button[role=combobox]]:bg-muted [&_button[role=combobox]]:border-border [&_button[role=combobox]]:text-foreground">
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
        <p className="text-[15px] text-foreground">Signed in as</p>
        <p className="mt-1 text-[13px] sheet-muted">{session?.user?.email ?? "–"}</p>
        <div className="mt-5">
          <Button onClick={handleSignOut} variant="outline" className="bg-muted border-border text-foreground hover:bg-muted/80">
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
      <p className="text-[15px] text-foreground">Appearance</p>
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
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-muted/60 text-foreground hover:bg-muted"
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

function InviteCodeCard() {
  const fetchCode = useServerFn(getOrCreatePersonalShareCode);
  const [code, setCode] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetchCode({ data: undefined } as never);
      setCode((res as { code: string }).code);
    } catch (e) {
      toast.error("Couldn't get an invite code");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = code ? `${typeof window !== "undefined" ? window.location.origin : "https://purplelife.org"}/?invite=${code}` : "";

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const share = async () => {
    if (!shareUrl) return;
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: "Purple",
          text: "Try Purple, a quiet, private health journal.",
          url: shareUrl,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      void copy();
    }
  };

  return (
    <div>
      <p className="text-[15px] text-foreground">Get an invite code</p>
      <p className="mt-1 text-[13px] sheet-muted">
        Share Purple with someone who could use a calmer way to track their health.
      </p>
      {!code ? (
        <div className="mt-4">
          <Button
            onClick={generate}
            disabled={loading}
            variant="outline"
            className="bg-muted border-border text-foreground hover:bg-muted/80"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create my invite code"}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted px-4 py-3">
            <code className="text-[15px] tracking-widest text-foreground">{code}</code>
            <span className="text-[12px] sheet-muted">Unlimited uses</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={copy}
              variant="outline"
              className="bg-muted border-border text-foreground hover:bg-muted/80"
            >
              {copied ? <Check className="mr-2 h-4 w-4 text-emerald-400" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              onClick={share}
              variant="outline"
              className="bg-muted border-border text-foreground hover:bg-muted/80"
            >
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}