import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResponsiveImage } from "@/components/marketing/responsive-image";
import { signInImages } from "@/lib/calm-images/sign-in";
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
      const msg = t("signIn.enterEmailFirst");
      setErrorMsg(msg);
      toast.error(msg);
      setStatus("error");
      return;
    }
    setStatus("submitting");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) {
      setErrorMsg(error.message);
      toast.error(error.message);
      setStatus("error");
      return;
    }
    setStatus("reset-sent");
  };

  const friendlyAuthError = (msg: string): string => {
    const m = msg.toLowerCase();
    if (m.includes("invalid login credentials")) return "Email or password is incorrect.";
    if (m.includes("email not confirmed")) return "Please confirm your email first.";
    return msg;
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
        const msg = friendlyAuthError(error.message);
        setErrorMsg(msg);
        toast.error(msg);
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
    const showAlreadyRegistered = () => {
      const msg = t("signIn.alreadyRegistered");
      setMode("signin");
      setErrorMsg(msg);
      toast.error(msg);
      setStatus("error");
    };
    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        showAlreadyRegistered();
        return;
      }
      const msg = friendlyAuthError(error.message);
      setErrorMsg(msg);
      toast.error(msg);
      setStatus("error");
      return;
    }
    // With email confirmations enabled, Supabase protects against email
    // enumeration: signUp for an existing confirmed email "succeeds" with an
    // obfuscated user that has no identities instead of returning an error.
    if (!data.session && data.user && (data.user.identities?.length ?? 0) === 0) {
      showAlreadyRegistered();
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
    <div className="relative h-dvh overflow-hidden flex items-center justify-center text-foreground px-3 sm:px-6 py-3 sm:py-6">
      {/* Full-bleed hero photo behind the card */}
      <div className="fixed inset-0 -z-10 bg-background">
        <ResponsiveImage
          asset={signInImages.hero}
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-background/70 via-background/55 to-background/70"
          aria-hidden="true"
        />
      </div>

      <div className="w-full max-w-5xl h-full max-h-[720px] rounded-[28px] lg:rounded-[36px] border border-border bg-card/95 backdrop-blur-sm shadow-[0_40px_80px_-20px_rgba(0,0,0,0.18)] overflow-hidden grid grid-cols-1 lg:grid-cols-[42%_1fr]">
        {/* LEFT — editorial brand panel */}
        <aside className="hidden lg:flex flex-col justify-between bg-secondary/60 border-r border-border p-10 xl:p-12">
          <p className="label-eyebrow text-primary">PURPLE</p>

          <div className="max-w-sm">
            <h2 className="font-serif text-4xl xl:text-5xl leading-[1.05] tracking-tight text-foreground">
              {t("signIn.title")}
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {t("signIn.tag1")}
            </p>
          </div>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            No ads. No trackers. Your data is yours.
          </p>
        </aside>

        {/* Mobile-only compact brand header */}
        <div className="lg:hidden px-6 pt-6 pb-1">
          <p className="label-eyebrow text-primary">PURPLE</p>
          <h1 className="mt-2 font-serif text-2xl sm:text-3xl leading-[1.05] tracking-tight text-foreground">
            {t("signIn.title")}
          </h1>
        </div>

        {/* RIGHT — auth column */}
        <main className="flex flex-col justify-center px-6 sm:px-10 lg:px-10 py-4 sm:py-6 lg:py-8 overflow-y-auto">
          <div className="w-full max-w-[340px] mx-auto">
            {status === "verify-sent" ? (
              <div className="mt-8 rounded-2xl border border-border bg-secondary/60 p-6">
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
              <div className="mt-8 rounded-2xl border border-border bg-secondary/60 p-6">
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
              <div>
                <Tabs value={mode} onValueChange={(v) => { setMode(v as "signin" | "register"); setErrorMsg(null); }}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="signin">{t("signIn.tabSignIn")}</TabsTrigger>
                    <TabsTrigger value="register">{t("signIn.tabRegister")}</TabsTrigger>
                  </TabsList>
                  <TabsContent value={mode} forceMount>
                    <form onSubmit={handleSubmit} className="space-y-2.5">
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
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (status === "error") { setStatus("idle"); setErrorMsg(null); }
                        }}
                        aria-invalid={status === "error"}
                        className={`h-11 text-base font-serif rounded-xl ${status === "error" ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        disabled={status === "submitting"}
                      />
                      <div className="flex items-baseline justify-between pt-1">
                        <label htmlFor="password" className="label-eyebrow block">
                          {t("signIn.password")}
                        </label>
                        {mode === "signin" && (
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={status === "submitting"}
                            className="text-xs font-sans text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50"
                          >
                            {t("signIn.forgot")}
                          </button>
                        )}
                      </div>
                      <PasswordInput
                        id="password"
                        required
                        minLength={8}
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        placeholder={mode === "register" ? t("signIn.passwordPlaceholderNew") : t("signIn.passwordPlaceholderSignIn")}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (status === "error") { setStatus("idle"); setErrorMsg(null); }
                        }}
                        aria-invalid={status === "error"}
                        className={`h-11 text-base font-serif rounded-xl ${status === "error" ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        disabled={status === "submitting"}
                      />
                      {status === "error" && errorMsg && (
                        <p role="alert" className="text-sm text-destructive pt-1">
                          {errorMsg}
                        </p>
                      )}
                      {mode === "register" && (
                        <p className="text-xs text-muted-foreground pt-0.5">
                          We&rsquo;ll ask a few quick things after you confirm your email, region, conditions, and anything else that helps Purple help you.
                        </p>
                      )}
                      <Button
                        type="submit"
                        className="w-full h-11 text-base rounded-xl mt-2"
                        disabled={status === "submitting"}
                      >
                        {status === "submitting"
                          ? mode === "signin" ? t("signIn.signingIn") : t("signIn.creating")
                          : mode === "signin" ? t("signIn.signIn") : t("signIn.createAccount")}
                      </Button>
                    </form>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center" aria-hidden>
                        <span className="w-full border-t border-border" />
                      </div>
                      <p className="relative flex justify-center">
                        <span className="bg-card px-3 text-[10px] font-sans uppercase tracking-widest text-muted-foreground">
                          {t("signIn.orUseAnother")}
                        </span>
                      </p>
                    </div>
                    <SocialSignInButtons helper="" />
                  </TabsContent>
                </Tabs>

                <p className="mt-4 text-center text-xs text-muted-foreground">
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
    </div>
  );
}