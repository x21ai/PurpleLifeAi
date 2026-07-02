import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [verifyingMfa, setVerifyingMfa] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash and fires PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // A recovery-link session is AAL1. If the account has a verified MFA factor,
    // Supabase rejects updateUser({ password }) until the session is elevated to
    // AAL2, so we ask for the authenticator code first.
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
      // Fallback: if the AAL check above missed it, route the raw AAL2 error
      // to the authenticator step instead of surfacing Supabase's message.
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
    setTimeout(() => navigate({ to: "/" }), 1200);
  };

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
              disabled={!ready || status === "submitting"}
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
              disabled={!ready || status === "submitting"}
            />
            <Button type="submit" className="w-full h-14 text-base rounded-xl" disabled={!ready || status === "submitting"}>
              {status === "submitting" ? t("resetPassword.updating") : t("resetPassword.updateBtn")}
            </Button>
            {!ready && (
              <p className="text-sm text-muted-foreground">
                {t("resetPassword.openFromEmail")}
              </p>
            )}
            {errorMsg && (
              <p className="text-sm text-destructive" role="alert">{errorMsg}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}