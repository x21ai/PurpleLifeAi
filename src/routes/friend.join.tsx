import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlatformFlagGate } from "@/lib/platform-flags";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptFriendByCode } from "@/lib/friendships.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/friend/join")({
  head: () => ({ meta: [{ title: "Join a circle · Purple" }] }),
  component: GatedJoinByCodePage,
});

function GatedJoinByCodePage() {
  return (
    <PlatformFlagGate flag="friends" redirectTo="/">
      <JoinByCodePage />
    </PlatformFlagGate>
  );
}

function JoinByCodePage() {
  const navigate = useNavigate();
  const accept = useServerFn(acceptFriendByCode);
  const [code, setCode] = useState("");
  const [state, setState] = useState<"checking" | "idle" | "running" | "done" | "error">(
    "checking",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/sign-in", search: { redirect: "/friend/join" } as never });
        return;
      }
      setState("idle");
    })();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setState("running");
    try {
      await accept({ data: { code: code.trim() } });
      setState("done");
      setTimeout(() => navigate({ to: "/settings/sharing" }), 900);
    } catch (err: any) {
      setState("error");
      setMessage(err?.message ?? "Couldn't join with that code.");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="label-eyebrow text-muted-foreground text-center">Circle invite</p>
        <h1 className="mt-2 font-serif text-4xl text-foreground text-center">
          Join a friend's circle
        </h1>
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Enter the short code your friend sent you. No health data is shared either way &mdash;
          you're just connected on Purple.
        </p>

        {state === "checking" ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Loader2 className="inline h-3 w-3 animate-spin" /> Checking your session&hellip;
          </p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={submit}>
            <div>
              <Label htmlFor="code">Invite code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD-2345"
                autoComplete="off"
                maxLength={16}
                className="mt-1 text-center text-lg tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full" disabled={state === "running" || !code.trim()}>
              {state === "running" ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Joining&hellip;
                </>
              ) : (
                "Join circle"
              )}
            </Button>
            {state === "done" && (
              <p className="text-center text-sm text-emerald-600">
                All set. Taking you to your sharing settings&hellip;
              </p>
            )}
            {state === "error" && <p className="text-center text-sm text-destructive">{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
