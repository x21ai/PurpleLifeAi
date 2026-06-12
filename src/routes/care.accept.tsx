import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/care.functions";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  token: z.string().min(20).max(128).optional(),
});

export const Route = createFileRoute("/care/accept")({
  head: () => ({ meta: [{ title: "Accept invite · Purple" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = useSearch({ from: "/care/accept" });
  const navigate = useNavigate();
  const accept = useServerFn(acceptInvite);
  const [state, setState] = useState<"idle" | "checking" | "running" | "done" | "error">(
    "checking",
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    (async () => {
      if (!token) {
        setState("error");
        setMessage("This link is missing its invite token.");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/sign-in", search: { redirect: `/care/accept?token=${token}` } as never });
        return;
      }
      setState("idle");
    })();
  }, [token, navigate]);

  async function handleAccept() {
    if (!token) return;
    setState("running");
    try {
      await accept({ data: { invite_token: token } });
      setState("done");
      // Phase 3: land on /care so caregivers see all owners they care for.
      setTimeout(() => navigate({ to: "/care" }), 800);
    } catch (e: any) {
      setState("error");
      setMessage(e?.message ?? "Couldn't accept this invite.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="label-eyebrow text-muted-foreground">Caregiver invite</p>
        <h1 className="mt-2 font-serif text-4xl text-foreground">Join their circle</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Accepting gives you the access they granted. They'll always control what you can do and
          can revoke any time.
        </p>
        {state === "checking" && (
          <p className="mt-6 text-sm text-muted-foreground">
            <Loader2 className="inline h-3 w-3 animate-spin" /> Checking your session…
          </p>
        )}
        {state === "idle" && (
          <Button className="mt-6" onClick={handleAccept}>
            Accept invite
          </Button>
        )}
        {state === "running" && (
          <p className="mt-6 text-sm text-muted-foreground">
            <Loader2 className="inline h-3 w-3 animate-spin" /> Accepting…
          </p>
        )}
        {state === "done" && (
          <p className="mt-6 text-sm text-emerald-600">All set. Taking you to their dashboard…</p>
        )}
        {state === "error" && <p className="mt-6 text-sm text-destructive">{message}</p>}
      </div>
    </div>
  );
}
