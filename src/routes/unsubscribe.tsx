import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Status = "loading" | "valid" | "already" | "invalid" | "done" | "error";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = useSearch({ from: "/unsubscribe" });
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) return setStatus("invalid");
        if (body.valid === true) return setStatus("valid");
        if (body.reason === "already_unsubscribed") return setStatus("already");
        setStatus("invalid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setStatus("done");
      else if (body.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {status === "loading" && <p>Checking your link…</p>}
          {status === "invalid" && (
            <p>This unsubscribe link is invalid or has expired.</p>
          )}
          {status === "already" && (
            <p>You're already unsubscribed. No further emails will be sent.</p>
          )}
          {status === "valid" && (
            <>
              <p className="text-foreground">
                Unsubscribe this address from Purple Life emails?
              </p>
              <Button
                className="w-full"
                disabled={submitting}
                onClick={confirm}
              >
                {submitting ? "Working…" : "Confirm unsubscribe"}
              </Button>
            </>
          )}
          {status === "done" && (
            <p className="text-foreground">You've been unsubscribed.</p>
          )}
          {status === "error" && (
            <p>Something went wrong. Please try again later.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}