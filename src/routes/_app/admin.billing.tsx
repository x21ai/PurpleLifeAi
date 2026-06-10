import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  getBillingSettings,
  setProFreeForEveryone,
  grantProToUser,
  listPaidSubscribers,
} from "@/lib/billing.functions";

export const Route = createFileRoute("/_app/admin/billing")({
  head: () => ({ meta: [{ title: "Billing · Admin · Purple" }] }),
  component: AdminBillingPage,
});

function AdminBillingPage() {
  const qc = useQueryClient();
  const getSettings = useServerFn(getBillingSettings);
  const toggleFlag = useServerFn(setProFreeForEveryone);
  const grant = useServerFn(grantProToUser);
  const listSubs = useServerFn(listPaidSubscribers);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-billing-settings"],
    queryFn: () => getSettings(),
  });
  const { data: subsData } = useQuery({
    queryKey: ["admin-paid-subscribers"],
    queryFn: () => listSubs(),
  });

  const flip = useMutation({
    mutationFn: (enabled: boolean) => toggleFlag({ data: { enabled } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-billing-settings"] });
      qc.invalidateQueries({ queryKey: ["my-subscription"] });
      toast.success("Updated.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const [grantUserId, setGrantUserId] = React.useState("");
  const [grantMonths, setGrantMonths] = React.useState(12);

  const grantMut = useMutation({
    mutationFn: () => grant({ data: { userId: grantUserId.trim(), months: grantMonths } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-paid-subscribers"] });
      toast.success("Pro granted.");
      setGrantUserId("");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-4xl">Billing</h1>
        <p className="mt-2 text-muted-foreground">Manage Pro tier access and subscriptions.</p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Stripe status</p>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <StatusRow ok={!!settings?.stripeConfigured} label="Secret key" />
          <StatusRow ok={!!settings?.webhookConfigured} label="Webhook secret" />
        </div>
        {!settings?.stripeConfigured && (
          <p className="mt-4 text-xs text-amber-500 inline-flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Stripe is not configured. Checkout is disabled until secrets are added.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">Pro free for everyone</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-prose">
              While this is on, every signed-in user (including new sign-ups) gets full Pro access
              automatically. Paywalls and the Upgrade button stay hidden.
            </p>
          </div>
          <button
            type="button"
            onClick={() => flip.mutate(!settings?.freeForEveryone)}
            disabled={flip.isPending}
            className={`shrink-0 inline-flex h-7 w-12 items-center rounded-full transition ${
              settings?.freeForEveryone ? "bg-[color:var(--purple-primary)]" : "bg-muted"
            }`}
            aria-pressed={!!settings?.freeForEveryone}
          >
            <span
              className={`h-6 w-6 rounded-full bg-white transition ${
                settings?.freeForEveryone ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Grant Pro to a user</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Creates a synthetic active subscription. No Stripe call. Use it for comps or VIPs.
        </p>
        <div className="mt-5 grid sm:grid-cols-[1fr_120px_auto] gap-2">
          <input
            type="text"
            value={grantUserId}
            onChange={(e) => setGrantUserId(e.target.value)}
            placeholder="User ID (uuid)"
            className="rounded-xl border border-border bg-muted px-4 py-2 text-sm font-mono"
          />
          <input
            type="number"
            min={1}
            max={120}
            value={grantMonths}
            onChange={(e) => setGrantMonths(Number(e.target.value) || 12)}
            className="rounded-xl border border-border bg-muted px-4 py-2 text-sm"
            placeholder="Months"
          />
          <button
            type="button"
            onClick={() => grantMut.mutate()}
            disabled={grantMut.isPending || !grantUserId.trim()}
            className="rounded-xl bg-[color:var(--purple-primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {grantMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant Pro"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Subscribers</h2>
        {!subsData?.rows.length ? (
          <p className="mt-3 text-sm text-muted-foreground">No active subscriptions yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {subsData.rows.map((r) => (
              <li key={r.user_id} className="py-3 text-sm flex items-center gap-3">
                <span className="font-mono text-xs text-muted-foreground truncate">{r.user_id}</span>
                <span className="ml-auto text-xs uppercase tracking-wider">{r.status}</span>
                <span className="text-xs text-muted-foreground">
                  {r.current_period_end ? new Date(r.current_period_end).toLocaleDateString() : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <ShieldCheck className={`h-4 w-4 ${ok ? "text-emerald-500" : "text-muted-foreground"}`} />
      <span>{label}:</span>
      <span className={ok ? "text-emerald-500" : "text-amber-500"}>{ok ? "Configured" : "Not set"}</span>
    </div>
  );
}