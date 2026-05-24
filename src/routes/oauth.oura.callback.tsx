import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/oauth/oura/callback")({
  head: () => ({ meta: [{ title: "Connecting Oura — Purple" }] }),
  component: OuraCallback,
});

function OuraCallback() {
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Connecting your Oura Ring…");

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const err = params.get("error");
        const errDescription = params.get("error_description");
        if (err) throw new Error(errDescription ? `${err}: ${errDescription}` : err);
        if (!code) throw new Error("Missing authorization code");

        const redirect_uri = window.location.origin + "/oauth/oura/callback";
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) throw new Error("Not signed in");

        const res = await supabase.functions.invoke("oura-sync", {
          body: { action: "exchange", code, redirect_uri },
        });
        if (res.error) throw res.error;

        setStatus("done");
        setMessage("Connected. Syncing your last 90 days…");
        try { window.opener?.postMessage({ type: "oura-connected" }, window.location.origin); } catch {}
        setTimeout(() => window.close(), 1200);
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message ?? "Something went wrong");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <p className="font-serif text-2xl text-foreground">
          {status === "error" ? "We couldn’t connect" : "Oura Ring"}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        {status === "error" && (
          <button
            className="mt-6 text-sm text-primary underline"
            onClick={() => window.close()}
          >
            Close window
          </button>
        )}
      </div>
    </div>
  );
}