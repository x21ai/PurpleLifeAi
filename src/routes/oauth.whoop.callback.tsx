import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { exchangeWhoopAuthCode } from "@/lib/whoop.functions";

export const Route = createFileRoute("/oauth/whoop/callback")({
  head: () => ({ meta: [{ title: "Connecting Whoop · Purple" }] }),
  component: WhoopCallback,
});

function WhoopCallback() {
  const exchange = useServerFn(exchangeWhoopAuthCode);
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Connecting your Whoop…");

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const err = params.get("error");
        const errDescription = params.get("error_description");
        if (err) throw new Error(errDescription ? `${err}: ${errDescription}` : err);
        if (!code) throw new Error("Missing authorization code");

        const redirect_uri = window.location.origin + "/oauth/whoop/callback";
        await exchange({ data: { code, redirect_uri } });

        setStatus("done");
        setMessage("Connected. Backfilling your last 30 days…");
        try {
          window.opener?.postMessage({ type: "whoop-connected" }, window.location.origin);
        } catch {
          /* ignore */
        }
        setTimeout(() => window.close(), 1200);
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Something went wrong");
      }
    })();
  }, [exchange]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <p className="font-serif text-2xl text-foreground">
          {status === "error" ? "We couldn’t connect" : "Whoop"}
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