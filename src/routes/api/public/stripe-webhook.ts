import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const secretKey = process.env.STRIPE_SECRET_KEY;

        if (!webhookSecret?.startsWith("whsec_") || !secretKey?.startsWith("sk_")) {
          console.warn("[stripe-webhook] Stripe not configured; rejecting webhook.");
          return new Response("Billing not configured", { status: 503 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const body = await request.text();

        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(secretKey, {
          httpClient: Stripe.createFetchHttpClient(),
        });

        let event: import("stripe").Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        } catch (err) {
          console.error("[stripe-webhook] Signature verification failed:", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        async function upsertFromSubscription(sub: import("stripe").Stripe.Subscription) {
          let userId = sub.metadata?.user_id as string | undefined;
          if (
            !userId &&
            typeof sub.customer === "object" &&
            !("deleted" in sub.customer && sub.customer.deleted)
          ) {
            userId = (sub.customer as import("stripe").Stripe.Customer).metadata?.user_id;
          }
          if (!userId) {
            console.warn("[stripe-webhook] No user_id in subscription metadata", sub.id);
            return;
          }
          const periodEnd = sub.items.data[0]?.current_period_end ?? null;
          await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
              stripe_subscription_id: sub.id,
              price_id: sub.items.data[0]?.price.id ?? null,
              status: sub.status,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
            },
            { onConflict: "user_id" },
          );
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as import("stripe").Stripe.Checkout.Session;
              if (session.subscription) {
                const subId =
                  typeof session.subscription === "string"
                    ? session.subscription
                    : session.subscription.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                await upsertFromSubscription(sub);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              await upsertFromSubscription(
                event.data.object as import("stripe").Stripe.Subscription,
              );
              break;
            }
            case "invoice.payment_failed": {
              const inv = event.data.object as import("stripe").Stripe.Invoice & {
                subscription?: string | { id: string } | null;
              };
              const subRef = inv.subscription;
              const subId = typeof subRef === "string" ? subRef : subRef?.id;
              if (subId) {
                const sub = await stripe.subscriptions.retrieve(subId);
                await upsertFromSubscription(sub);
              }
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error("[stripe-webhook] Handler error", event.type, err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
