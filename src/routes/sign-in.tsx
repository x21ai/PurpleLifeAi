import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import heroImage from "@/assets/sign-in-hero.jpg";
import { SiteFooter } from "@/components/layout/site-footer";
import { SocialSignInButtons } from "@/components/auth/social-sign-in-buttons";
import { isOAuthCallbackUrl, waitForOAuthSession } from "@/lib/auth-oauth";
import { toast } from "sonner";

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
      { title: "Sign in — Purple" },
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
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "verify-sent" | "reset-sent" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = Route.useNavigate();

  useEffect(() => {
    const msg = oauthErrorMessage();
    if (!msg) return;
    toast.error("Sign-in didn't finish. Try again, or use your email instead.");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    if (!email.trim()) {
      setErrorMsg("Enter your email above, then tap Forgot password.");
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
    if (data.session) {
      await navigate({ to: "/today" });
      return;
    }
    setStatus("verify-sent");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="lg:grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.25fr_1fr]">
        {/* Hero — full bleed image, top on mobile, left on desktop */}
        <div className="relative h-[42vh] sm:h-[52vh] lg:h-screen lg:sticky lg:top-0 overflow-hidden">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            width={1280}
            height={1600}
          />
          <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-r from-background/0 via-background/0 to-background/85" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-14">
            <p
              className="font-sans font-semibold text-sm sm:text-base text-foreground/80"
              style={{ letterSpacing: "0.45em" }}
            >
              PURPLE
            </p>
            <p className="mt-3 font-serif italic text-base sm:text-lg text-foreground/75 max-w-md">
              Free forever. Open source. No ads.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <main className="flex items-center justify-center px-6 sm:px-10 lg:px-14 py-12 lg:py-16 min-h-screen">
          <div className="w-full max-w-md">
            <p className="label-eyebrow">Sign in</p>
            <h1 className="mt-5 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-foreground">
              A quiet intelligence for your health.
            </h1>

            <div className="mt-8 space-y-3 text-base sm:text-[17px] leading-relaxed text-muted-foreground max-w-prose">
              <p>Write, speak, or snap whatever&rsquo;s happening with your body or your day.</p>
              <p>Purple listens, remembers, and quietly notices the patterns over time.</p>
            </div>

            {status === "verify-sent" ? (
              <div className="mt-10 rounded-2xl border border-border bg-secondary/60 p-6">
                <p className="label-eyebrow">Check your inbox</p>
                <p className="mt-3 font-serif text-2xl text-secondary-foreground leading-snug">
                  Confirm your email to finish creating your account.
                </p>
              </div>
            ) : status === "reset-sent" ? (
              <div className="mt-10 rounded-2xl border border-border bg-secondary/60 p-6">
                <p className="label-eyebrow">Check your inbox</p>
                <p className="mt-3 font-serif text-2xl text-secondary-foreground leading-snug">
                  We sent you a link to reset your password.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-4 text-sm font-sans text-muted-foreground underline underline-offset-4"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <div className="mt-10">
                <SocialSignInButtons />
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center" aria-hidden>
                    <span className="w-full border-t border-border" />
                  </div>
                  <p className="relative flex justify-center">
                    <span className="bg-background px-3 text-xs font-sans uppercase tracking-widest text-muted-foreground">
                      or continue with email
                    </span>
                  </p>
                </div>
                <Tabs value={mode} onValueChange={(v) => { setMode(v as "signin" | "register"); setErrorMsg(null); }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign in</TabsTrigger>
                    <TabsTrigger value="register">Create account</TabsTrigger>
                  </TabsList>
                  <TabsContent value={mode} forceMount>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      <label htmlFor="email" className="label-eyebrow block">
                        Email address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 text-lg font-serif rounded-xl"
                        disabled={status === "submitting"}
                      />
                      <label htmlFor="password" className="label-eyebrow block pt-1">
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={8}
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 text-lg font-serif rounded-xl"
                        disabled={status === "submitting"}
                      />
                      <Button
                        type="submit"
                        className="w-full h-14 text-base rounded-xl"
                        disabled={status === "submitting"}
                      >
                        {status === "submitting"
                          ? mode === "signin" ? "Signing in\u2026" : "Creating account\u2026"
                          : mode === "signin" ? "Sign in" : "Create account"}
                      </Button>
                      {mode === "signin" && (
                        <div className="pt-1 text-right">
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={status === "submitting"}
                            className="text-sm font-sans text-muted-foreground hover:text-foreground underline underline-offset-4 disabled:opacity-50"
                          >
                            Forgot password?
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
              </div>
            )}

            <p className="mt-10 text-xs text-muted-foreground/80">
              Your data stays yours. Always.
            </p>
          </div>
        </main>
      </div>
      <SiteFooter variant="marketing" />
    </div>
  );
}