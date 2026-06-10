## Direct Stripe Integration + Pro Tier

Use Stripe directly with your own API keys (not Lovable's payments gateway). Start in **test mode**; flip to live by swapping the secrets later. A global "Pro free for everyone" flag keeps all users on Pro until you say otherwise.

### 1. Stripe setup (you)
You'll create in Stripe (test mode):
- Product: "Purple Pro"
- Price 1: $9.99 / month (recurring)
- Price 2: $99 / year (recurring)
- Webhook endpoint pointing at `https://purplelife.org/api/public/stripe-webhook` (events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`)

Then I'll request these secrets via the secrets form:
- `STRIPE_SECRET_KEY` (sk_test_…)
- `STRIPE_WEBHOOK_SECRET` (whsec_…)
- `STRIPE_PRICE_MONTHLY` (price_…)
- `STRIPE_PRICE_YEARLY` (price_…)

`VITE_STRIPE_PUBLISHABLE_KEY` goes in code (publishable, safe).

### 2. Database
New migration:
- `subscriptions` table: `user_id` (unique), `stripe_customer_id`, `stripe_subscription_id`, `price_id`, `status` (active/past_due/canceled/trialing), `current_period_end`, `cancel_at_period_end`
- `app_settings` table (singleton row): `pro_free_for_everyone boolean default true`, `pro_features jsonb` (per-feature toggles)
- `has_pro(uid)` security-definer function: returns true if global flag is on, user has `super_admin` role, or active subscription exists

All with proper GRANTs + RLS (users read own subscription; only super_admin writes app_settings).

### 3. Server functions (`src/lib/billing.functions.ts`)
- `createCheckoutSession({ interval: 'monthly' | 'yearly' })` — auth-required; creates/reuses Stripe customer, returns Checkout URL
- `createBillingPortalSession()` — returns Stripe customer portal URL
- `getMySubscription()` — returns current sub + computed `isPro`

### 4. Webhook route
`src/routes/api/public/stripe-webhook.ts` — verifies Stripe signature (raw body + `STRIPE_WEBHOOK_SECRET`), upserts `subscriptions` via `supabaseAdmin` on subscription/checkout/invoice events.

### 5. Feature gates (`src/lib/pro-gate.ts`)
`useIsPro()` hook + `<ProGate feature="dna">` wrapper. Gated features:
- **DNA upload & insights** — gate the upload form on `/my-health-dna`
- **Ask Purple unlimited** — free tier: 10 messages/day (tracked in existing ai_memory); Pro: unlimited
- **Medical report sharing/scheduling** — gate the "Share" and "Schedule" buttons on reports
- **Caregiver seats** — free: 1 active caregiver, Pro: unlimited

Each gate shows a soft paywall card → "Upgrade to Pro" button → Stripe Checkout. While `pro_free_for_everyone=true`, gates pass through silently.

### 6. UI
- `/pricing` route — Monthly $9.99 / Yearly $99 cards, "Start with Pro" buttons → checkout
- Account settings → "Subscription" section: current plan, "Manage billing" (portal), "Upgrade" if free
- Admin panel (super_admin only) → toggle for `pro_free_for_everyone` + per-user "Grant Pro" action

### 7. Technical notes
- Uses `stripe` npm package server-side (Worker-compatible via fetch).
- Webhook is under `/api/public/*` so it bypasses auth; signature verification is mandatory.
- No Lovable payments gateway involved — purely your Stripe account.

### What you do vs what I do
**You:** create products + webhook in Stripe dashboard, then paste the 4 secrets when I prompt.
**Me:** everything else — DB, server fns, webhook, gates, pricing page, admin toggle.

Once you approve, I'll start with the migration and the secret request in parallel.
