import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapRecoverySessionFromUrl } from "@/lib/auth-recovery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password · Purple" },
      { name: "description", content: "Choose a new password for your Purple account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [verifyingMfa, setVerifyingMfa] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setLinkExpired(false);
      }
    });

    void (async () => {
      const result = await bootstrapRecoverySessionFromUrl();
      if (cancelled) return;

      if (result.ok) {
        setReady(true);
        setLinkExpired(false);
      } else if (result.expired) {
        setLinkExpired(true);
        setErrorMsg(result.message ?? t("resetPassword.linkExpired"));
      } else if (result.message) {
        setErrorMsg(result.message);
      }

      setBootstrapping(false);
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [t]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const checkAssuranceLevel = async () => {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled || !data) return;
      if (data.currentLevel === "aal1" && data.nextLevel === "aal2") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.find((f) => f.status === "verified");
        if (!cancelled && totp) {
          setMfaFactorId(totp.id);
          setMfaRequired(true);
        }
      }
    };
    void checkAssuranceLevel();
    return () => { cancelled = true; };
  }, [ready]);

  const handleVerifyMfa = async (e: FormEvent) => {
    e.preventDefault();
    if (!mfaFactorId) return;
    setErrorMsg(null);
    setVerifyingMfa(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
    if (challenge.error || !challenge.data) {
      setErrorMsg(challenge.error?.message ?? t("resetPassword.mfaInvalid"));
      setVerifyingMfa(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.data.id,
      code: totpCode.trim(),
    });
    setVerifyingMfa(false);
    if (error) {
      setErrorMsg(t("resetPassword.mfaInvalid"));
      return;
    }
    setMfaRequired(false);
    setTotpCode("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 8) {
      setErrorMsg(t("resetPassword.tooShort"));
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setErrorMsg(t("resetPassword.mismatch"));
      setStatus("error");
      return;
    }
    setStatus("submitting");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (/aal2/i.test(error.message)) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.find((f) => f.status === "verified");
        if (totp) setMfaFactorId(totp.id);
        setMfaRequired(true);
        setErrorMsg(t("resetPassword.mfaNeeded"));
        setStatus("idle");
        return;
      }
      setErrorMsg(error.message);
      setStatus("error");
      return;
    }
    setStatus("done");
    setTimeout(() => navigate({ to: "/sign-in" }), 1200);
  };

  const showForm = ready && !linkExpired;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <p className="label-eyebrow">{t("resetPassword.eyebrow")}</p>
        <h1 className="mt-5 font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight">
          {t("resetPassword.title")}
        </h1>

        {status === "done" ? (
          <p className="mt-10 font-serif text-xl text-muted-foreground">
            {t("resetPassword.done")}
          </p>
        ) : bootstrapping ? (
          <p className="mt-10 text-sm text-muted-foreground">
            {t("resetPassword.verifyingLink")}
          </p>
        ) : linkExpired || (!ready && !bootstrapping) ? (
          <div className="mt-10 space-y-4">
            <p className="text-sm text-muted-foreground">
              {errorMsg ?? t("resetPassword.openFromEmail")}
            </p>
            <Button asChild className="w-full h-14 text-base rounded-xl">
              <Link to="/sign-in" search={{ reset: "expired" }}>
                {t("resetPassword.requestNewLink")}
              </Link>
            </Button>
          </div>
        ) : mfaRequired ? (
          <form onSubmit={handleVerifyMfa} className="mt-10 space-y-4">
            <p className="text-sm text-muted-foreground">{t("resetPassword.mfaPrompt")}</p>
            <label htmlFor="totp-code" className="label-eyebrow block">{t("resetPassword.mfaCodeLabel")}</label>
            <Input
              id="totp-code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder={t("resetPassword.mfaPlaceholder")}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="h-14 text-lg font-serif rounded-xl tracking-[0.3em]"
              disabled={verifyingMfa}
            />
            <Button type="submit" className="w-full h-14 text-base rounded-xl" disabled={verifyingMfa || totpCode.trim().length < 6}>
              {verifyingMfa ? t("resetPassword.mfaVerifying") : t("resetPassword.mfaVerifyBtn")}
            </Button>
            {errorMsg && (
              <p className="text-sm text-destructive" role="alert">{errorMsg}</p>
            )}
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <label htmlFor="new-password" className="label-eyebrow block">{t("resetPassword.newPassword")}</label>
            <PasswordInput
              id="new-password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder={t("resetPassword.newPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-lg font-serif rounded-xl"
              disabled={!showForm || status === "submitting"}
            />
            <label htmlFor="confirm-password" className="label-eyebrow block pt-1">{t("resetPassword.confirmPassword")}</label>
            <PasswordInput
              id="confirm-password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder={t("resetPassword.confirmPlaceholder")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-14 text-lg font-serif rounded-xl"
              disabled={!showForm || status === "submitting"}
            />
            <Button type="submit" className="w-full h-14 text-base rounded-xl" disabled={!showForm || status === "submitting"}>
              {status === "submitting" ? t("resetPassword.updating") : t("resetPassword.updateBtn")}
            </Button>
            {errorMsg && (
              <p className="text-sm text-destructive" role="alert">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
