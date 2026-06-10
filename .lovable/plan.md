# Finish the remaining three items

Three open threads from earlier. Plan below covers each end-to-end.

> Heads-up on item 3 — Purple's `/pricing` page commits to **"Free. Forever."** and the brand rule is "no paywall." A traditional billing wiring would contradict that. I'm proposing **optional donations / "support Purple"** instead, using Lovable's built-in payments. If you actually want a paid tier with gated features, say so and I'll swap step 3 for a Pro tier with entitlement checks.

---

## 1. Condition onboarding nudge

A one-screen, dismissible card shown right after sign-up that says "Here's what Purple will track for your conditions" — tailored to the conditions the user picked during `/welcome`.

**Where it appears**
- New component `<ConditionWelcomeNudge />` rendered at the top of `/today`, above the greeting, only when:
  - `profiles.conditions` has at least one entry, AND
  - `profiles.welcome_nudge_dismissed_at` is null.
- Dismiss writes `welcome_nudge_dismissed_at = now()` (autosave, no toast). Never shown again.

**Content (built from condition list)**
- Title: "Purple is set up for {first condition} {+N more if applicable}."
- 3–5 bullet rows generated from `src/lib/condition-prompts.ts` (already condition-aware) — e.g. for epilepsy: "Seizure logging from Today", "Med adherence + dose reminders", "Triggers from sleep, stress, missed meds".
- Footer: "Adjust anytime in Settings → My Health" + "Got it" dismiss button.

**Files**
- New: `src/components/today/condition-welcome-nudge.tsx`
- New helper: `src/lib/condition-welcome-copy.ts` (maps condition slug → bullets, reusing condition-prompts where possible)
- Edit: `src/routes/_app/today.tsx` — render nudge above greeting
- Migration: add `welcome_nudge_dismissed_at timestamptz` to `profiles`

---

## 2. Friend social-tier permission UI

Data model is already in place (`friendships`, refer codes). What's missing is the UI to optionally **upgrade** a friend from social-only (zero data) to a light "social tier" view — and to revoke it. No new data scopes; this layers on the existing `care_scopes` table with a fixed `tier = 'social'` scope set.

**What "social tier" exposes** (deliberately tiny)
- First name, profile photo, current condition tag(s) — nothing time-series, nothing journal, nothing biometric.
- Pulled from `profiles` already.

**UI changes in `Settings → Sharing → Your circle`**
- Each active friend row gets a new "Share basics" toggle (off by default).
- Turning on opens a small confirm sheet listing exactly what they'll see; turning off revokes immediately.
- Status chip on the row: "Social only" (default) or "Sees basics" when on.
- Friend list re-fetches; toast on change.

**Server**
- New `setFriendSocialTier({ friendship_id, enabled })` in `src/lib/friendships.functions.ts` — writes a `care_scopes` row scoped to `kind='friend_basics'` (or removes it).
- `listMyCircle` returns each friendship's current tier so the toggle hydrates correctly.
- New `getFriendBasics({ friendship_id })` for the viewer side — returns the limited profile fields only when the scope row exists.

**Viewer side**
- New leaf route `/_app/friends.$friendshipId.tsx` — a minimal "About {name}" page. If no scope, shows "No shared details — just a friend."
- Add a "Friends" leaf under the Community sidebar group (only visible when the user has at least one active friendship).

**Migration**
- No new tables. Adds a `kind` value `'friend_basics'` to the existing `care_scopes.kind` check constraint (or extends the enum) and indexes by `(grantee_id, kind)`.

**Files**
- Edit: `src/lib/friendships.functions.ts`, `src/components/sharing/circle-section.tsx`
- New: `src/routes/_app/friends.$friendshipId.tsx`
- Edit: `src/components/layout/nav-items.ts` (conditional Friends leaf)
- Migration: extend `care_scopes` kind

---

## 3. "Support Purple" donations (replaces paywall wiring)

Keep the free-forever promise, but give users a way to contribute. This is the minimum that won't betray the brand.

**Flow**
- `/pricing` keeps the "$0 / forever" hero. Add a second, quieter section below: **"Support Purple"** with three suggested amounts ($5, $15, $50 — one-time) and a "custom" input. No nag, no popup.
- Account → Session gets a small "Support Purple" link (same destination).
- After payment → thank-you page + a tiny "Supporter" badge on the user's profile (purely cosmetic, never gates features).

**Provider**
- Use Lovable's built-in payments. I'll run `recommend_payment_provider` first to pick Paddle vs Stripe based on the project type and your seller country. Donations are a soft case — likely Stripe with tax calculation only, since donation tax-handling depends on whether you're a registered nonprofit. **I'll ask before enabling** so you can confirm provider + seller country.

**Server / data**
- New table `public.supporter_contributions` (amount, currency, provider, provider_payment_id, user_id, created_at) with RLS so users only see their own.
- Webhook route `app/routes/api/public/hooks/payments.ts` records successful payments and flips a `profiles.is_supporter` boolean.
- Server fn `createSupportCheckout({ amount, currency })` returns a hosted checkout URL.

**Files**
- New: `src/components/pricing/support-card.tsx`, `src/routes/support.success.tsx`, `app/routes/api/public/hooks/payments.ts`, `src/lib/support.functions.ts`
- Edit: `src/routes/pricing.tsx`, `src/routes/_app/account.tsx`
- Migration: `supporter_contributions` table + `profiles.is_supporter boolean`

**Approval gates inside this step**
1. Confirm donations (not paywall) is what you want.
2. Confirm seller country so I can pick the provider.
3. Then enable provider + create products + wire checkout.

---

## Build order
1. Condition onboarding nudge (smallest, ships first).
2. Friend social-tier UI.
3. Support Purple (only after you confirm donations vs paywall and seller country).

## Out of scope
- Gated Pro features behind a paywall (only if you say so in item 3)
- Recurring donations (one-time first; recurring is a follow-up)
- Migrating `pronouns` data (already dropped in earlier plan)
