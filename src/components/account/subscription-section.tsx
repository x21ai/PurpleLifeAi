import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { userMessage } from "@/lib/user-message";
import {
  getMySubscription,
  createCheckoutSession,
  createBillingPortalSession,
} from "@/lib/billing.functions";

export function SubscriptionSection() {
  const fetchSub = useServerFn(getMySubscription);
  const checkout = useServerFn(createCheckoutSession);
  const portal = useServerFn(createBillingPortalSession);

  const { data, isLoading } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => fetchSub(),
  });

  const startCheckout = useMutation({
    mutationFn: (interval: "monthly" | "yearly") => checkout({ data: { interval } }),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
    onError: (e: unknown) =>
      toast.error(userMessage(e, "Couldn't start checkout")),
  });

  const openPortal = useMutation({
    mutationFn: () => portal(),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
    onError: (e: unknown) =>
      toast.error(userMessage(e, "Couldn't open billing portal")),
  });

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;

  if (data?.freeForEveryone) {
    return (
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--purple-primary)]/15 px-3 py-1 text-[11px] uppercase tracking-wider text-[color:var(--purple-primary)]">
          <Sparkles className="h-3 w-3" /> Pro · free for everyone
        </div>
        <p className="mt-3 text-[15px] text-foreground">You have full Pro access.</p>
        <p className="mt-1 text-[13px] sheet-muted">
          Purple is free for everyone right now. No payment needed.
        </p>
      </div>
    );
  }

  if (data?.hasPaidSubscription) {
    return (
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--purple-primary)]/15 px-3 py-1 text-[11px] uppercase tracking-wider text-[color:var(--purple-primary)]">
          <Sparkles className="h-3 w-3" /> Purple Pro
        </div>
        <p className="mt-3 text-[15px] text-foreground">
          {data.status === "active" ? "Active" : data.status}
          {data.currentPeriodEnd
            ? ` · renews ${new Date(data.currentPeriodEnd).toLocaleDateString()}`
            : ""}
          {data.cancelAtPeriodEnd ? " · cancels at period end" : ""}
        </p>
        <button
          type="button"
          onClick={() => openPortal.mutate()}
          disabled={openPortal.isPending}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-border bg-muted px-5 py-2 text-sm font-medium text-foreground hover:bg-muted/80 disabled:opacity-60"
        >
          {openPortal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage billing"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[15px] text-foreground">Purple · Free</p>
      <p className="mt-1 text-[13px] sheet-muted">
        Upgrade for DNA insights, unlimited Ask Purple, sharing & scheduled reports, and unlimited
        caregiver seats.
      </p>
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => startCheckout.mutate("monthly")}
          disabled={startCheckout.isPending}
          className="rounded-2xl border border-border bg-muted px-5 py-4 text-left hover:bg-muted/80 disabled:opacity-60"
        >
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Monthly</p>
          <p className="mt-1 font-serif text-3xl">$9.99</p>
          <p className="text-[12px] sheet-muted">per month</p>
        </button>
        <button
          type="button"
          onClick={() => startCheckout.mutate("yearly")}
          disabled={startCheckout.isPending}
          className="rounded-2xl border border-[color:var(--purple-primary)] bg-[color:var(--purple-primary)]/10 px-5 py-4 text-left hover:bg-[color:var(--purple-primary)]/15 disabled:opacity-60"
        >
          <p className="text-[11px] uppercase tracking-wider text-[color:var(--purple-primary)]">
            Yearly · save 17%
          </p>
          <p className="mt-1 font-serif text-3xl">$99</p>
          <p className="text-[12px] sheet-muted">per year</p>
        </button>
      </div>
    </div>
  );
}