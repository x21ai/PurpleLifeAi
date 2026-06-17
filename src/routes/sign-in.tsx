import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteFooter } from "@/components/layout/site-footer";
import { ResponsiveImage } from "@/components/marketing/responsive-image";
import { signInImages } from "@/lib/calm-images";
import { SocialSignInButtons } from "@/components/auth/social-sign-in-buttons";
import { isOAuthCallbackUrl, waitForOAuthSession } from "@/lib/auth-oauth";
import { toast } from "sonner";
import { setLocale, detectBrowserLocale, type SupportedLocale } from "@/i18n";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { redeemInviteCode } from "@/lib/invite-codes.functions";
import { captureInviteFromUrl, getStoredInvite, clearStoredInvite } from "@/lib/invite-storage";

const LOCALE_PREFILL_KEY = "purple-locale-prefill";

/**
 * Auto-detect a sensible locale prefill for /welcome. The user doesn't see this
 * during sign-up, /welcome shows it pre-filled so they can confirm or change.
 */
function detectAndStorePrefill(): { country: string | null; timezone: string | null; locale: SupportedLocale } {
  const locale = detectBrowserLocale();
  let timezone: string | null = null;
  let country: string | null = null;
  try {
    const opts = Intl.DateTimeFormat().resolvedOptions();
    timezone = opts.timeZone ?? null;
    // Browser locale often carries region (e.g. en-US → US)
    const region = new Intl.Locale(opts.locale ?? locale).region;
    if (region) country = region;
  } catch {
    // older browsers, leave nulls; /welcome will ask
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        LOCALE_PREFILL_KEY,
        JSON.stringify({ country, timezone, locale }),
      );
    } catch {
      // ignore
    }
  }
  return { country, timezone, locale };
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
  const [status, setStatus] = useState<
    "idle" | "submitting" | "verify-sent" | "reset-sent" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = Route.useNavigate();
  const redeem = useServerFn(redeemInviteCode);

  useEffect(() => {
    // Silently capture invite codes from URL and detect locale for /welcome.
    captureInviteFromUrl();
    detectAndStorePrefill();
  }, []);

  useEffect(() => {
    const msg = oauthErrorMessage();
    if (!msg) return;
    toast.error(t("signIn.oauthError"));
    window.history.replaceState({}, "", window.location.pathname);
  }, [t]);

  // While waiting on email confirmation, advance the tab the moment a session
  // appears (cross-tab Supabase sync fires SIGNED_IN; the poll covers the rest).
  // True cross-device confirmation never creates a session here, so the UI also
  // offers a "sign in" fallback below.
  useEffect(() => {
    if (status !== "verify-sent") return;
    let cancelled = false;
    const goIfSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session) {
        await navigate({ to: "/today" });
      }
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void goIfSession();
    });
    const poll = window.setInterval(() => void goIfSession(), 3000);
    void goIfSession();
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.clearInterval(poll);
    };
  }, [status, navigate]);

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
    // Persist auto-detected locale prefill so /welcome shows sensible defaults.
    const prefill = detectAndStorePrefill();
    setLocale(prefill.locale);
    if (data.session) {
      // Redeem any invite captured from URL silently.
      const code = (getStoredInvite() ?? "").trim().toUpperCase();
      if (code) {
        try {
          const res = await redeem({ data: { code } });
          if (res.ok) {
            clearStoredInvite();
            toast.success("Invite code applied");
          }
        } catch {
          /* non-fatal */
        }
      }
      // Save immediately so a fresh profile starts with the right locale.
      void supabase.from("profiles").upsert({
        id: data.session.user.id,
        country: prefill.country,
        timezone: prefill.timezone,
        locale: prefill.locale,
      });
      await navigate({ to: "/today" });
      return;
    }
    setStatus("verify-sent");
  };

  return (
    <div className="relative min-h-dvh text-foreground">
      {/* Full-bleed hero photo */}
      <div className="fixed inset-0 -z-10 bg-background">
        <ResponsiveImage
          asset={signInImages.hero}
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Right-side gradient so the form column reads cleanly over the photo */}
        <div
          className="absolute inset-0 bg-gradient-to-l from-background via-background/85 to-background/10 lg:from-background lg:via-background/70 lg:to-background/0"
          aria-hidden="true"
        />
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_minmax(420px,560px)]">
        {/* Wordmark column, left, breathing room on the photo */}
        <aside className="hidden lg:flex flex-col justify-end p-14 min-h-dvh">
          <p
            className="label-eyebrow"
            style={{ color: "#FFFFFF", opacity: 0.92, textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
          >
            PURPLE
          </p>
          <p
            className="mt-4 font-serif italic text-lg max-w-sm leading-relaxed"
            style={{ color: "#FFFFFF", opacity: 0.85, textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
          >
            {t("signIn.freeForever")}
          </p>
        </aside>

        {/* Form panel */}
        <main className="flex items-center justify-center px-6 sm:px-10 lg:px-14 py-12 lg:py-16 min-h-dvh">
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
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setStatus("idle");
                  }}
                  className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  {t("signIn.confirmedElsewhere", {
                    defaultValue: "Confirmed on another device? Sign in",
                  })}
                </button>
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
                        <p className="text-xs text-muted-foreground pt-1">
                          We&rsquo;ll ask a few quick things after you confirm your email, region, conditions, and anything else that helps Purple help you.
                        </p>
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
                <p className="mt-8 text-center text-xs text-muted-foreground">
                  {t("signIn.trustLine")}{" "}
                  <Link
                    to="/trust"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {t("signIn.trustLink")}
                  </Link>
                </p>
              </div>
            )}

          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}