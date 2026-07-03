import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  const [agreed, setAgreed] = useState(false);
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
    if (mode === "register" && !agreed) {
      const msg = "Please agree to the terms of use and privacy policy to continue.";
      setErrorMsg(msg);
      toast.error(msg);
      setStatus("error");
      return;
    }
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
    <div className="h-dvh overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground">
      {/* LEFT: brand panel */}
      <aside className="hidden lg:flex relative flex-col justify-between p-14 xl:p-16 bg-[#050505] text-white overflow-hidden">
        {/* Ambient aura mesh */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-1/4 -left-1/4 h-[70%] w-[70%] rounded-full bg-purple-600/20 blur-[120px]" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[60%] w-[60%] rounded-full bg-indigo-600/15 blur-[100px]" />
          <div className="absolute top-1/3 left-1/3 h-[40%] w-[40%] rounded-full bg-fuchsia-900/10 blur-[110px]" />
        </div>
        {/* Subtle grain overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.7'/></svg>\")",
          }}
        />
        {/* Decorative concentric arcs, top-right */}
        <svg
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-[680px] w-[680px] text-white/[0.06]"
          viewBox="0 0 600 600"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          {[520, 440, 360, 280, 200, 120].map((r) => (
            <path key={r} d={`M 600 ${600 - r} A ${r} ${r} 0 0 0 ${600 - r} 600`} />
          ))}
        </svg>

        <p className="relative z-10 text-xs font-semibold tracking-[0.3em] uppercase text-white/90">
          PURPLE
        </p>

        <div className="relative z-10 max-w-md">
          <h2 className="font-serif text-6xl xl:text-7xl leading-[0.95] tracking-tight">
            Welcome to <br /> Purple.
          </h2>
          <div className="mt-6 h-px w-12 bg-white/20" />
          <p className="mt-6 text-base leading-relaxed text-white/70 max-w-sm">
            {t("signIn.tag1")}
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} Purple. All rights reserved.
        </p>
      </aside>

      {/* RIGHT: auth column */}
      <main className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-8 lg:py-10 overflow-y-auto">
        <div className="w-full max-w-[400px] mx-auto">
          {/* Mobile-only wordmark */}
          <p className="lg:hidden text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-6">
            PURPLE
          </p>

          {status === "verify-sent" ? (
            <div className="rounded-2xl border border-border bg-secondary/60 p-6">
              <p className="label-eyebrow">{t("signIn.checkInbox")}</p>
              <p className="mt-3 font-serif text-2xl text-secondary-foreground leading-snug">
                {t("signIn.confirmEmail")}
              </p>
              <button
                type="button"
                onClick={() => { setMode("signin"); setStatus("idle"); }}
                className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {t("signIn.confirmedElsewhere", { defaultValue: "Confirmed on another device? Sign in" })}
              </button>
            </div>
          ) : status === "reset-sent" ? (
            <div className="rounded-2xl border border-border bg-secondary/60 p-6">
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
              <h1 className="font-serif text-3xl lg:text-4xl tracking-tight text-foreground">
                {mode === "signin" ? "Welcome back!" : "Create your account"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    Don&rsquo;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("register"); setErrorMsg(null); }}
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Create a new account now
                    </button>
                    , it&rsquo;s FREE! Takes less than a minute.
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("signin"); setErrorMsg(null); }}
                      className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="Email address" // live-data-guard:allow (input placeholder, not stored data)
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") { setStatus("idle"); setErrorMsg(null); }
                    }}
                    aria-invalid={status === "error"}
                    className={`h-11 rounded-none border-0 border-b bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:border-primary ${status === "error" ? "border-destructive" : "border-border"}`}
                    disabled={status === "submitting"}
                  />
                </div>

                <div>
                  <PasswordInput
                    id="password"
                    required
                    minLength={8}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (status === "error") { setStatus("idle"); setErrorMsg(null); }
                    }}
                    aria-invalid={status === "error"}
                    className={`h-11 rounded-none border-0 border-b bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:border-primary ${status === "error" ? "border-destructive" : "border-border"}`}
                    disabled={status === "submitting"}
                  />
                </div>

                {status === "error" && errorMsg && (
                  <p role="alert" className="text-sm text-destructive">{errorMsg}</p>
                )}
                {mode === "register" && (
                  <p className="text-xs text-muted-foreground">
                    We&rsquo;ll ask a few quick things after you confirm your email, region, conditions, and anything else that helps Purple help you.
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base rounded-md mt-2"
                  disabled={status === "submitting"}
                >
                  {status === "submitting"
                    ? mode === "signin" ? t("signIn.signingIn") : t("signIn.creating")
                    : mode === "signin" ? "Login Now" : t("signIn.createAccount")}
                </Button>
              </form>

              <div className="mt-4">
                <SocialSignInButtons helper="" />
              </div>

              {mode === "signin" && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Forgot password?{" "}
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={status === "submitting"}
                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary disabled:opacity-50"
                  >
                    Click here
                  </button>
                </p>
              )}

              <p className="mt-6 text-center text-xs text-muted-foreground">
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
  );
}