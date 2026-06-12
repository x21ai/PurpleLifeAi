import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { PlatformFlagGate } from "@/lib/platform-flags";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { acceptFriendInvite } from "@/lib/friendships.functions";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

const searchSchema = z.object({
  token: z.string().min(20).max(128).optional(),
});

export const Route = createFileRoute("/friend/accept")({
  head: () => ({ meta: [{ title: "Join their circle · Purple" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: GatedAcceptFriendPage,
});

function GatedAcceptFriendPage() {
  return (
    <PlatformFlagGate flag="friends" redirectTo="/">
      <AcceptFriendPage />
    </PlatformFlagGate>
  );
}

function AcceptFriendPage() {
  const { token } = useSearch({ from: "/friend/accept" });
  const navigate = useNavigate();
  const accept = useServerFn(acceptFriendInvite);
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
        navigate({
          to: "/sign-in",
          search: { redirect: `/friend/accept?token=${token}` } as never,
        });
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
      setTimeout(() => navigate({ to: "/settings/sharing" }), 900);
    } catch (e: any) {
      setState("error");
      setMessage(e?.message ?? "Couldn't accept this invite.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="label-eyebrow text-muted-foreground">Circle invite</p>
        <h1 className="mt-2 font-serif text-4xl text-foreground">Join their circle</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          A circle on Purple is just a list of people you know. Joining shares no health data,
          journal entries, or reports. You simply appear in each other's contacts. Either of you can
          leave at any time.
        </p>
        {state === "checking" && (
          <p className="mt-6 text-sm text-muted-foreground">
            <Loader2 className="inline h-3 w-3 animate-spin" /> Checking your session&hellip;
          </p>
        )}
        {state === "idle" && (
          <Button className="mt-6" onClick={handleAccept}>
            Join their circle
          </Button>
        )}
        {state === "running" && (
          <p className="mt-6 text-sm text-muted-foreground">
            <Loader2 className="inline h-3 w-3 animate-spin" /> Joining&hellip;
          </p>
        )}
        {state === "done" && (
          <p className="mt-6 text-sm text-emerald-600">
            All set. Taking you to your sharing settings&hellip;
          </p>
        )}
        {state === "error" && <p className="mt-6 text-sm text-destructive">{message}</p>}
        <p className="mt-8 text-xs text-muted-foreground">
          Got a code instead of a link?{" "}
          <Link to="/friend/join" className="underline">
            Enter a code
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
