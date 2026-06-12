import * as React from "react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { userMessage } from "@/lib/user-message";

type Enrollment = {
  factorId: string;
  qr: string;
  secret: string;
};

export function TwoFactorSection() {
  const [hasFactor, setHasFactor] = React.useState<boolean | null>(null);
  const [factorId, setFactorId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null);
  const [code, setCode] = React.useState("");

  React.useEffect(() => {
    void refresh();
  }, []);

  const refresh = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return;
    const verified = data?.totp?.find((f) => f.status === "verified") ?? null;
    setHasFactor(!!verified);
    setFactorId(verified?.id ?? null);
  };

  const startEnroll = async () => {
    setBusy(true);
    // Clean any prior unverified attempts so we don't stack factors.
    const list = await supabase.auth.mfa.listFactors();
    for (const f of list.data?.totp ?? []) {
      if (f.status !== "verified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setBusy(false);
    if (error || !data) return toast.error(userMessage(error, "Couldn't start 2FA"));
    setEnrollment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const verify = async () => {
    if (!enrollment) return;
    setBusy(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
    if (challenge.error || !challenge.data) {
      setBusy(false);
      return toast.error(challenge.error?.message ?? "Couldn't issue challenge");
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    setBusy(false);
    if (error) return toast.error(userMessage(error, "That didn't work. Try again in a moment."));
    setEnrollment(null);
    setCode("");
    toast.success("2FA enabled");
    void refresh();
  };

  const disable = async () => {
    if (!factorId) return;
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) return toast.error(userMessage(error, "That didn't work. Try again in a moment."));
    toast.success("2FA disabled");
    void refresh();
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        {hasFactor ? (
          <ShieldCheck className="h-4 w-4 text-[#6FB394]" />
        ) : (
          <ShieldOff className="h-4 w-4 text-[#B084D1]" />
        )}
        <p className="text-[15px] text-[#FAFAFC]">Two-factor authentication</p>
      </div>
      <p className="mt-1 text-[13px] sheet-muted">
        Adds a 6-digit code from your authenticator app on every sign-in.
      </p>

      {hasFactor === null && <p className="mt-4 text-[13px] sheet-muted">Checking status…</p>}

      {hasFactor === true && (
        <div className="mt-4">
          <Button
            onClick={disable}
            disabled={busy}
            variant="outline"
            className="bg-white/[0.04] border-white/10 text-[#FAFAFC] hover:bg-white/10"
          >
            {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Disable 2FA
          </Button>
        </div>
      )}

      {hasFactor === false && !enrollment && (
        <div className="mt-4">
          <Button
            onClick={startEnroll}
            disabled={busy}
            variant="outline"
            className="bg-white/[0.04] border-white/10 text-[#FAFAFC] hover:bg-white/10"
          >
            {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Enable 2FA
          </Button>
        </div>
      )}

      {enrollment && (
        <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[13px] sheet-muted">
            Scan this QR code with your authenticator app, then enter the 6-digit code.
          </p>
          <div className="flex flex-col items-start gap-3 sm:flex-row">
            <img
              src={enrollment.qr}
              alt="2FA QR code"
              className="h-40 w-40 rounded-lg bg-white p-2"
            />
            <div className="flex-1 space-y-2">
              <p className="text-[11px] uppercase tracking-wider sheet-muted">Or type secret</p>
              <code className="block break-all rounded bg-white/[0.06] px-2 py-1 text-[12px] text-[#FAFAFC]">
                {enrollment.secret}
              </code>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                inputMode="numeric"
                maxLength={6}
                className="bg-white/[0.04] border-white/10 text-[#FAFAFC] placeholder:text-white/30"
              />
              <div className="flex gap-2">
                <Button
                  onClick={verify}
                  disabled={busy || code.length < 6}
                  className="bg-[#B084D1] text-[#0A0710] hover:bg-[#C7A0E0]"
                >
                  {busy && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Verify
                </Button>
                <Button
                  onClick={() => {
                    if (enrollment.factorId) {
                      void supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
                    }
                    setEnrollment(null);
                    setCode("");
                  }}
                  variant="outline"
                  className="bg-white/[0.04] border-white/10 text-[#FAFAFC] hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
