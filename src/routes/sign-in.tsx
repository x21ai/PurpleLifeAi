import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteFooter } from "@/components/layout/site-footer";
import { CalmHero } from "@/components/marketing/calm-scene";
import { signInImages } from "@/lib/calm-images";
import { SocialSignInButtons } from "@/components/auth/social-sign-in-buttons";
import { isOAuthCallbackUrl, waitForOAuthSession } from "@/lib/auth-oauth";
import { toast } from "sonner";
import { LocaleFields, type LocaleValues } from "@/components/locale/locale-fields";
import { setLocale, detectBrowserLocale, type SupportedLocale } from "@/i18n";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { redeemInviteCode } from "@/lib/invite-codes.functions";
import { captureInviteFromUrl, getStoredInvite, setStoredInvite, clearStoredInvite } from "@/lib/invite-storage";

const LOCALE_PREFILL_KEY = "purple-locale-prefill";

function readPrefill(): LocaleValues {
  if (typeof window === "undefined") {
    return { country: null, timezone: null, locale: "en" };
  }
  try {
    const raw = localStorage.getItem(LOCALE_PREFILL_KEY);
    if (raw) return JSON.parse(raw) as LocaleValues;
  } catch {
    // ignore
  }
  return { country: null, timezone: null, locale: detectBrowserLocale() };
}

export const Route = createFileRoute("/sign-in")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    if (isOAuthCallbackUrl()) {
      const ok = await waitForOAuthSession();
      if (ok) throw redirect({ to: "/today" });
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: "/today" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in · Purple" },
      {
        name: "description",
        content: "Sign in or create your Purple account. A quiet intelligence for your health.",
      },
    ],
  }),
  component: SignInPage,
});

function oauthErrorMessage(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const err =
    params.get("error_description") ??
    params.get("error") ??
    hashParams.get("error_description") ??
    hashParams.get("error");
  if (!err) return null;
  return err.replace(/\+/g, " ");
}

function SignInPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"signin" | "register">(() => {
    if (typeof window === "undefined") return "signin";
    const hash = window.location.hash.replace(/^#/, "");
    return hash === "register" ? "register" : "signin";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "verify-sent" | "reset-sent" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localeValues, setLocaleValues] = useState<LocaleValues>(() => readPrefill());
  const navigate = Route.useNavigate();
  const redeem = useServerFn(redeemInviteCode);

  useEffect(() => {
    captureInviteFromUrl();
    const stored = getStoredInvite();
    if (stored) setInviteCode(stored);
  }, []);

  useEffect(() => {
    const msg = oauthErrorMessage();
    if (!msg) return;
    toast.error(t("signIn.oauthError"));
    window.history.replaceState({}, "", window.location.pathname);
  }, [t]);

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg(t("signIn.enterEmailFirst"));
      setStatus("error");
      return;
    }
    setStatus("submitting");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      return;
    }
    setStatus("reset-sent");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setStatus("submitting");
    setErrorMsg(null);
    if (mode === "signin") {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMsg(error.message);
        setStatus("error");
        return;
      }
      // Ensure the session is fully written to storage before we navigate,
      // otherwise the _app guard can read a stale null session and bounce
      // back to /sign-in, causing a perceived loop.
      if (!signInData.session) {
        await supabase.auth.getSession();
      }
      setStatus("idle");
      await navigate({ to: "/today" });
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin + "/today" },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      return;
    }
    // Persist locale prefill so /welcome (post-verification) can apply it.
    try {
      localStorage.setItem(LOCALE_PREFILL_KEY, JSON.stringify(localeValues));
    } catch {
      // ignore
    }
    setLocale(localeValues.locale as SupportedLocale);
    // Persist invite for later redemption (after email verification, etc.)
    if (inviteCode.trim()) setStoredInvite(inviteCode.trim().toUpperCase());
    if (data.session) {
      // Try to redeem immediately when we already have a session.
      const code = inviteCode.trim().toUpperCase();
      if (code) {
        try {
          const res = await redeem({ data: { code } });
          if (res.ok) {
            clearStoredInvite();
            toast.success("Invite code applied");
          } else {
            toast.error(`Invite code ${res.reason}`);
          }
        } catch {
          /* non-fatal */
        }
      }
      // Save immediately so a fresh profile starts with the right locale.
      void supabase.from("profiles").upsert({
        id: data.session.user.id,
        country: localeValues.country,
        timezone: localeValues.timezone,
        locale: localeValues.locale,
      });
      await navigate({ to: "/today" });
      return;
    }
    setStatus("verify-sent");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="lg:grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.25fr_1fr]">
        {/* Hero, shared calm-nature treatment */}
        <CalmHero
          image={signInImages.hero}
          variant="split"
          as="div"
          eyebrow="PURPLE"
          headline={
            <span className="font-serif italic text-base sm:text-lg text-foreground/75 max-w-md block">
              {t("signIn.freeForever")}
            </span>
          }
        />

        {/* Form panel */}
        <main className="flex items-center justify-center px-6 sm:px-10 lg:px-14 py-12 lg:py-16 min-h-screen">
          <div className="w-full max-w-md">
            <p className="label-eyebrow">{t("signIn.eyebrow")}</p>
            <h1 className="mt-5 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-foreground">
              {t("signIn.title")}
            </h1>

            <div className="mt-8 space-y-3 text-base sm:text-[17px] leading-relaxed text-muted-foreground max-w-prose">
              <p>{t("signIn.tag1")}</p>
              <p>{t("signIn.tag2")}</p>
            </div>

            {status === "verify-sent" ? (
              <div className="mt-10 rounded-2xl border border-border bg-secondary/60 p-6">
                <p className="label-eyebrow">{t("signIn.checkInbox")}</p>
                <p className="mt-3 font-serif text-2xl text-secondary-foreground leading-snug">
                  {t("signIn.confirmEmail")}
                </p>
              </div>
            ) : status === "reset-sent" ? (
              <div className="mt-10 rounded-2xl border border-border bg-secondary/60 p-6">
                <p className="label-eyebrow">{t("signIn.checkInbox")}</p>
                <p className="mt-3 font-serif text-2xl text-secondary-foreground leading-snug">
                  {t("signIn.resetSent")}
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-4 text-sm font-sans text-muted-foreground underline underline-offset-4"
                >
                  {t("signIn.backToSignIn")}
                </button>
              </div>
            ) : (
              <div className="mt-10">
                <Tabs value={mode} onValueChange={(v) => { setMode(v as "signin" | "register"); setErrorMsg(null); }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">{t("signIn.tabSignIn")}</TabsTrigger>
                    <TabsTrigger value="register">{t("signIn.tabRegister")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value={mode} forceMount>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <label htmlFor="email" className="label-eyebrow block">
                        {t("signIn.email")}
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@example.com" // live-data-guard:allow (input placeholder, not stored data)
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 text-lg font-serif rounded-xl"
                        disabled={status === "submitting"}
                      />
                      <label htmlFor="password" className="label-eyebrow block pt-1">
                        {t("signIn.password")}
                      </label>
                      <PasswordInput
                        id="password"
                        required
                        minLength={8}
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        placeholder={mode === "register" ? t("signIn.passwordPlaceholderNew") : t("signIn.passwordPlaceholderSignIn")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 text-lg font-serif rounded-xl"
                        disabled={status === "submitting"}
                      />
                      {mode === "register" && (
                        <div className="pt-4 border-t border-border mt-2">
                          <p className="label-eyebrow mb-3">{t("welcome.regionLanguage")}</p>
                          <LocaleFields
                            values={localeValues}
                            onChange={setLocaleValues}
                            compact
                          />
                          <label htmlFor="invite" className="label-eyebrow block mt-5 mb-2">
                            Invite code (optional)
                          </label>
                          <Input
                            id="invite"
                            type="text"
                            autoComplete="off"
                            placeholder="If a friend shared one"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            className="h-12 font-mono tracking-widest rounded-xl"
                            disabled={status === "submitting"}
                          />
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full h-14 text-base rounded-xl"
                        disabled={status === "submitting"}
                      >
                        {status === "submitting"
                          ? mode === "signin" ? t("signIn.signingIn") : t("signIn.creating")
                          : mode === "signin" ? t("signIn.signIn") : t("signIn.createAccount")}
                      </Button>
                      {mode === "signin" && (
                        <div className="pt-1 text-right">
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={status === "submitting"}
                            className="text-sm font-sans text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50"
                          >
                            {t("signIn.forgot")}
                          </button>
                        </div>
                      )}
                      {errorMsg && (
                        <p className="text-sm text-destructive" role="alert">
                          {errorMsg}
                        </p>
                      )}
                    </form>
                  </TabsContent>
                </Tabs>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <span className="w-full border-t border-border" />
                  </div>
                  <p className="relative flex justify-center">
                    <span className="bg-background px-3 text-xs font-sans uppercase tracking-widest text-muted-foreground">
                      {t("signIn.orUseAnother")}
                    </span>
                  </p>
                </div>
                <SocialSignInButtons helper="" />
              </div>
            )}

            <p className="mt-10 text-xs text-muted-foreground/80">
              {t("signIn.dataStaysYours")}
            </p>
          </div>
        </main>
      </div>
      <SiteFooter variant="marketing" />
    </div>
  );
}