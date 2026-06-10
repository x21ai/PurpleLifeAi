## Build Stripe scaffold now, plug in real keys later

You don't need Stripe keys yet. I'll build the entire Pro tier with placeholder values so checkout/portal/webhook code is in place but inert. The global **"Pro free for everyone"** flag (already added to the DB and defaulted to `true`) means every user — existing and new sign-ups — gets full Pro access until you flip the switch.

When you're ready to go live (test or production), you'll grab the keys from these spots in your Stripe dashboard:

| Secret | Where in Stripe |
|---|---|
| `STRIPE_SECRET_KEY` | Developers → API keys → "Secret key" (`sk_test_…` or `sk_live_…`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Same page → "Publishable key" (`pk_test_…`) |
| `STRIPE_PRICE_MONTHLY` | Product catalog → create "Purple Pro" with a $9.99/mo price → copy the `price_…` ID |
| `STRIPE_PRICE_YEARLY` | Same product, add a $99/yr price → copy that `price_…` ID |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → add endpoint `https://purplelife.org/api/public/stripe-webhook` → copy the signing secret (`whsec_…`) |

### What I'll build right now (no secrets needed)

1. **Already done:** `subscriptions` table, `app_settings` (with `pro_free_for_everyone = true`), `has_pro()` function.

2. **Server functions** (`src/lib/billing.functions.ts`)
   - `getMySubscription()` — returns `{ isPro, tier, status, currentPeriodEnd, freeForEveryone }`. Works today: returns `isPro: true` for everyone because of the global flag.
   - `createCheckoutSession({ interval })` — wraps Stripe SDK call. If `STRIPE_SECRET_KEY` is missing/placeholder, it throws a friendly "Billing isn't configured yet" error.
   - `createBillingPortalSession()` — same pattern.
   - `setProFreeForEveryone(enabled)` — super-admin only; flips the global flag.
   - `grantProToUser({ userId, months })` — super-admin only; inserts a synthetic subscription row with status `active` and a future period end. No Stripe call.

3. **Webhook route** (`src/routes/api/public/stripe-webhook.ts`)
   Full signature verification + handlers for `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`. Returns `503` with a clear log line if `STRIPE_WEBHOOK_SECRET` isn't set yet. Safe to leave deployed.

4. **Feature-gate primitives** (`src/lib/pro-gate.ts` + `src/components/pro/pro-gate.tsx`)
   - `useIsPro()` hook (reads `getMySubscription`).
   - `<ProGate feature="dna">{children}</ProGate>` — renders children when Pro, otherwise a soft upgrade card.
   - **No call sites wrapped yet** — gates stay invisible because everyone is Pro. We'll wrap DNA upload, Ask Purple limits, report sharing, and caregiver-seat checks in a follow-up turn so I don't change visible behavior today.

5. **`/pricing` page**
   Already exists — I'll update it to show Monthly $9.99 / Yearly $99 cards with a "Start Pro" button. While `pro_free_for_everyone = true`, the page shows a friendly banner: *"Purple is free for everyone right now. No payment needed."* and the buttons are disabled. When you flip the flag, buttons activate and call `createCheckoutSession`.

6. **Account settings → Subscription section**
   Shows current plan ("Pro · free for everyone" today). When billing is live and the user has a paid sub, shows "Manage billing" → portal link.

7. **Admin panel** (`/admin` → new "Billing" tab)
   - Big toggle: **"Pro free for everyone"** (on by default).
   - Search user → "Grant Pro for N months" action.
   - Read-only list of paid subscribers (empty until Stripe is wired).

8. **Stripe SDK install**
   `bun add stripe` — pure JS, Worker-compatible, no native deps. Calls are lazy so the missing key never breaks the build.

### Visible behavior today

- Every signed-in user (existing + new): full Pro access, no paywall anywhere.
- `/pricing` shows the price cards with the "free for everyone" banner.
- Account settings shows "Pro · free for everyone".
- Admin sees the toggle and Grant-Pro tool.
- Webhook route exists at `/api/public/stripe-webhook` but rejects until secrets are set.

### Later, when you're ready (one turn each)

- Paste the 5 secrets → checkout + portal start working immediately.
- Say "wrap the gates" → I add `<ProGate>` around DNA upload, Ask Purple limit, report sharing, caregiver seats.
- Say "flip free-for-everyone off" → done via admin toggle, no redeploy.

Approve and I'll build it now using only the keys' names — no values needed.
