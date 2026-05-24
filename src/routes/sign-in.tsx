import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/sign-in-hero.jpg";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign in — Purple" },
      {
        name: "description",
        content: "Sign in to Purple with a magic link. A quiet intelligence for your health.",
      },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin + "/",
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="lg:grid lg:grid-cols-[1.1fr_1fr] xl:grid-cols-[1.25fr_1fr] min-h-screen">
        {/* Hero — full bleed image, top on mobile, left on desktop */}
        <div className="relative h-[42vh] sm:h-[52vh] lg:h-screen overflow-hidden">
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
        <main className="flex items-center justify-center px-6 sm:px-10 lg:px-14 py-12 lg:py-16">
          <div className="w-full max-w-md">
            <p className="label-eyebrow">Sign in</p>
            <h1 className="mt-5 font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-foreground">
              A quiet intelligence for your health.
            </h1>

            <div className="mt-8 space-y-3 text-base sm:text-[17px] leading-relaxed text-muted-foreground max-w-prose">
              <p>Write, speak, or snap whatever&rsquo;s happening with your body or your day.</p>
              <p>Purple listens, remembers, and quietly notices the patterns over time.</p>
            </div>

            {status === "sent" ? (
              <div className="mt-10 rounded-2xl border border-border bg-secondary/60 p-6">
                <p className="label-eyebrow">Check your inbox</p>
                <p className="mt-3 font-serif text-2xl text-secondary-foreground leading-snug">
                  The link in that email will sign you in.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-10 space-y-4">
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
                  disabled={status === "sending"}
                />
                <Button
                  type="submit"
                  className="w-full h-14 text-base rounded-xl"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Sending\u2026" : "Send me a sign-in link"}
                </Button>
                {errorMsg && (
                  <p className="text-sm text-destructive" role="alert">
                    {errorMsg}
                  </p>
                )}
              </form>
            )}

            <p className="mt-10 text-xs text-muted-foreground/80">
              Your data stays yours. Always.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}