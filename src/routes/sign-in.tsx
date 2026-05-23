import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1
              className="font-sans font-semibold text-3xl sm:text-4xl text-primary"
              style={{ letterSpacing: "0.35em" }}
            >
              PURPLE
            </h1>
            <p className="mt-6 font-serif text-2xl sm:text-[28px] leading-snug text-foreground">
              A quiet intelligence for your health.
            </p>
          </div>

          <div className="mt-10 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
            <p>Write, speak, or snap whatever&rsquo;s happening with your body or your day.</p>
            <p>Purple listens, remembers, and quietly notices the patterns over time.</p>
            <p>Your data stays yours. Always. Free forever, no ads, never sold.</p>
          </div>

          {status === "sent" ? (
            <div className="mt-10 rounded-xl border border-border bg-secondary/60 p-5 text-center">
              <p className="font-serif text-lg text-secondary-foreground">
                Check your inbox.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                The link in that email will sign you in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-3">
              <label htmlFor="email" className="sr-only">
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
                className="h-12 text-base"
                disabled={status === "sending"}
              />
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending\u2026" : "Send me a sign-in link"}
              </Button>
              {errorMsg && (
                <p className="text-sm text-destructive text-center" role="alert">
                  {errorMsg}
                </p>
              )}
            </form>
          )}
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-muted-foreground/80">
        <p className="font-serif italic">Free forever. Open source. No ads.</p>
      </footer>
    </div>
  );
}