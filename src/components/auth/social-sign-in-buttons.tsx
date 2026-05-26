import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { oauthRedirectUrl } from "@/lib/auth-oauth";
import { toast } from "sonner";

function AppleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type Provider = "apple" | "google";

const providerLabels: Record<Provider, string> = {
  apple: "Continue with Apple",
  google: "Continue with Google",
};

export function SocialSignInButtons() {
  const [busy, setBusy] = useState<Provider | null>(null);

  const handleOAuth = async (provider: Provider) => {
    setBusy(provider);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: oauthRedirectUrl(),
    });
    if (result.error) {
      setBusy(null);
      toast.error(
        provider === "apple"
          ? "Apple sign-in didn't work. Try email, or try again in a moment."
          : "Google sign-in didn't work. Try email, or try again in a moment.",
      );
      return;
    }
    if (result.redirected) return;
    // Tokens already in session; full reload lands on the post-auth route.
    window.location.assign("/");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Sign in with the account you already have.
      </p>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => handleOAuth("apple")}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 text-[15px] font-sans font-medium text-black transition-colors duration-300 ease-out hover:bg-white/95 disabled:opacity-50"
      >
        <AppleLogo />
        {busy === "apple" ? "Opening Apple\u2026" : providerLabels.apple}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => handleOAuth("google")}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 text-[15px] font-sans font-medium text-foreground transition-colors duration-300 ease-out hover:bg-white/95 disabled:opacity-50"
      >
        <GoogleLogo />
        {busy === "google" ? "Opening Google\u2026" : providerLabels.google}
      </button>
    </div>
  );
}
