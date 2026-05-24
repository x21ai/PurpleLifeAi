import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Purple" },
      { name: "description", content: "Choose a new password for your Purple account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords don't match.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
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
        <p className="label-eyebrow">Reset password</p>
        <h1 className="mt-5 font-serif text-4xl sm:text-5xl leading-[1.05] tracking-tight">
          Choose a new password.
        </h1>

        {status === "done" ? (
          <p className="mt-10 font-serif text-xl text-muted-foreground">
            Password updated. Taking you to Purple&hellip;
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <label htmlFor="new-password" className="label-eyebrow block">New password</label>
            <Input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 text-lg font-serif rounded-xl"
              disabled={!ready || status === "submitting"}
            />
            <label htmlFor="confirm-password" className="label-eyebrow block pt-1">Confirm password</label>
            <Input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-14 text-lg font-serif rounded-xl"
              disabled={!ready || status === "submitting"}
            />
            <Button type="submit" className="w-full h-14 text-base rounded-xl" disabled={!ready || status === "submitting"}>
              {status === "submitting" ? "Updating\u2026" : "Update password"}
            </Button>
            {!ready && (
              <p className="text-sm text-muted-foreground">
                Open this page from the link in your reset email.
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