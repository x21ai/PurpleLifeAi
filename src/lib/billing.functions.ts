import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// --- Read current user's subscription state ---
export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [settingsRes, subRes] = await Promise.all([
      supabase.from("app_settings").select("pro_free_for_everyone").eq("id", true).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status, price_id, current_period_end, cancel_at_period_end, stripe_subscription_id")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const freeForEveryone = !!settingsRes.data?.pro_free_for_everyone;
    const sub = subRes.data;
    const subActive =
      !!sub &&
      ["active", "trialing", "past_due"].includes(sub.status ?? "") &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

    return {
      isPro: freeForEveryone || subActive,
      freeForEveryone,
      hasPaidSubscription: subActive,
      status: sub?.status ?? null,
      priceId: sub?.price_id ?? null,
      currentPeriodEnd: sub?.current_period_end ?? null,
      cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
      stripeSubscriptionId: sub?.stripe_subscription_id ?? null,
    };
  });

// --- Create a Stripe Checkout Session ---
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ interval: z.enum(["monthly", "yearly"]) }).parse(i))
  .handler(async ({ data, context }) => {
    const { getStripe, stripePrices, BillingNotConfiguredError } = await import("./billing.server");
    const stripe = getStripe();
    if (!stripe) throw new BillingNotConfiguredError();

    const prices = stripePrices();
    const priceId = data.interval === "monthly" ? prices.monthly : prices.yearly;
    if (!priceId) throw new BillingNotConfiguredError();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up or create the Stripe customer.
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id ?? null;

    if (!customerId) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(context.userId);
      const email = userData?.user?.email ?? undefined;
      const customer = await stripe.customers.create({
        email,
        metadata: { user_id: context.userId },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from("subscriptions")
        .upsert({ user_id: context.userId, stripe_customer_id: customerId, status: "inactive" }, { onConflict: "user_id" });
    }

    const origin =
      process.env.PUBLIC_SITE_URL ??
      process.env.SUPABASE_URL?.replace("https://", "https://app-") ??
      "https://purplelife.org";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?billing=success`,
      cancel_url: `${origin}/account?billing=cancel`,
      allow_promotion_codes: true,
      client_reference_id: context.userId,
      subscription_data: { metadata: { user_id: context.userId } },
    });

    return { url: session.url ?? "" };
  });

// --- Create a Stripe Customer Portal session ---
export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getStripe, BillingNotConfiguredError } = await import("./billing.server");
    const stripe = getStripe();
    if (!stripe) throw new BillingNotConfiguredError();

    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      throw new Error("No billing profile found. Start a subscription first.");
    }

    const origin = process.env.PUBLIC_SITE_URL ?? "https://purplelife.org";
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/account`,
    });

    return { url: session.url };
  });

// --- Admin: toggle the global "Pro free for everyone" flag ---
async function assertSuperAdmin(supabase: { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => Promise<{ data: { role: string }[] | null }> } } }, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("super_admin")) throw new Error("Not authorized");
}

export const setProFreeForEveryone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ enabled: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .update({ pro_free_for_everyone: data.enabled })
      .eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled };
  });

export const getBillingSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("pro_free_for_everyone, pro_features, updated_at")
      .eq("id", true)
      .maybeSingle();
    const stripeConfigured = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_");
    const webhookConfigured = !!process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_");
    return {
      freeForEveryone: !!data?.pro_free_for_everyone,
      proFeatures: (data?.pro_features as Record<string, boolean>) ?? {},
      updatedAt: data?.updated_at ?? null,
      stripeConfigured,
      webhookConfigured,
    };
  });

// --- Admin: grant Pro to a specific user (synthetic subscription, no Stripe call) ---
export const grantProToUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      userId: z.string().uuid(),
      months: z.number().int().min(1).max(120).default(12),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const expires = new Date();
    expires.setMonth(expires.getMonth() + data.months);
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: data.userId,
          status: "active",
          current_period_end: expires.toISOString(),
          price_id: "comp",
          cancel_at_period_end: false,
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true, expires: expires.toISOString() };
  });

export const listPaidSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, status, price_id, current_period_end, cancel_at_period_end, stripe_subscription_id, created_at")
      .neq("status", "inactive")
      .order("created_at", { ascending: false })
      .limit(200);
    return { rows: data ?? [] };
  });