import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound, LockKeyhole } from "lucide-react";
import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import { PrivacyShield } from "@/components/pages/pilot/components/mobile-graphics";
import { StagingBanner } from "./staging-banner";
import { isStagingLiveData } from "@/lib/staging/config";
import { signInWithPassword } from "@/lib/staging/session";

type StagingLiveSignInPageProps = {
  mode?: "sign-in" | "sign-up";
};

function redirectAfterAuth(): void {
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "/today";
  window.location.href = next.startsWith("/") ? next : "/today";
}

/**
 * Production-shaped sign-in for staging (POST /api/auth/sign-in via prod proxy).
 */
export function StagingLiveSignInPage({ mode = "sign-in" }: StagingLiveSignInPageProps) {
  const signingIn = mode === "sign-in";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!signingIn || loading) return;
    setError(null);
    setLoading(true);
    const result = await signInWithPassword(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    redirectAfterAuth();
  }

  return (
    <>
      <StagingBanner />
      <PilotAppShell active="today" showTabs={false} landscape="focused">
        <div className="purplelife-access-layout">
          <section className="px-5 pt-5 text-center">
            <PrivacyShield className="mx-auto w-full max-w-[310px]" />
            <p className="-mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-purplelife-accent">
              Staging · production D1
            </p>
            <h1 className="mx-auto mt-2 max-w-[350px] text-[33px] font-semibold leading-[1.02] tracking-[-0.05em]">
              {signingIn ? "Sign in to staging." : "Create your calm space."}
            </h1>
            <p className="mx-auto mt-3 max-w-[330px] text-[15px] leading-[1.45] text-purplelife-muted">
              {signingIn
                ? "Use your production account password. Same JWT and data as www.purplelife.org."
                : "Account creation on staging uses the production auth API. Prefer www for new accounts."}
            </p>
          </section>

          {isStagingLiveData() && signingIn && (
            <p className="mx-5 mt-4 rounded-[14px] bg-purplelife-tint px-3 py-2 text-[12px] font-medium text-purplelife-accent">
              Testers: sign in with pmt@eigital.com and the operator-provided password (Doppler / runbook).
            </p>
          )}

          <section className="mt-8 px-5">
            <form
              className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line"
              onSubmit={handleSubmit}
            >
              <label className="block text-[13px] font-semibold" htmlFor="access-email">
                Email
              </label>
              <input
                id="access-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-12 w-full rounded-[16px] bg-purplelife-rail px-4 text-[14px] outline-none focus:ring-2 focus:ring-purplelife-accent/35"
              />
              <label className="mt-4 block text-[13px] font-semibold" htmlFor="access-password">
                Password
              </label>
              <div className="relative mt-2">
                <KeyRound
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-purplelife-muted"
                />
                <input
                  id="access-password"
                  type="password"
                  autoComplete={signingIn ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full rounded-[16px] bg-purplelife-rail pl-11 pr-4 text-[14px] outline-none focus:ring-2 focus:ring-purplelife-accent/35"
                />
              </div>
              {error && <p className="mt-3 text-[12px] font-medium text-purplelife-coral">{error}</p>}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent text-[14px] font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Signing in…" : signingIn ? "Sign in" : "Create account"}
                <ArrowRight size={18} />
              </button>
              {signingIn && (
                <a
                  href="/reset-password"
                  className="mt-2 flex h-10 items-center justify-center text-[13px] font-semibold text-purplelife-accent"
                >
                  Password recovery
                </a>
              )}
              <a
                href={signingIn ? "/sign-up" : "/sign-in"}
                className="mt-1 flex h-10 items-center justify-center text-[13px] font-semibold text-purplelife-muted"
              >
                {signingIn ? "Create an account" : "I already have an account"}
              </a>
            </form>
          </section>

          <section className="mt-5 px-5">
            <p className="flex gap-3 rounded-[22px] bg-purplelife-tint p-4 text-[12px] leading-[1.45] text-purplelife-muted">
              <LockKeyhole size={19} className="shrink-0 text-purplelife-accent" />
              Staging uses the same prod Worker auth path (`POST /api/auth/sign-in`). Session token is stored in
              `localStorage` as `purple-cf-session`, matching www Cloudflare auth.
            </p>
          </section>
        </div>
      </PilotAppShell>
    </>
  );
}
