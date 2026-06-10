
# Three things: Stripe setup, DNA uploads, what's left

## 1. Stripe (test mode now, live later)

**Approach**
- Enable Lovable's built-in Stripe Payments via `payments--enable_stripe_payments`. Test environment is provisioned immediately; the user later "claims" the Stripe account to go live. Nothing charges real cards until claimed.
- Create one **Pro** product in Stripe (monthly + yearly prices). Single tier — "Highest tier" — so everyone you grant gets the full feature set.
- Add an `is_pro` boolean (server-trusted) on `profiles`, plus a `pro_grant_source` text ('founder', 'stripe', 'comp') and `pro_until timestamptz`. Default `is_pro = true` for now, controlled by an admin action ("all users free until I say so"). When you flip the global flag off later, only users with a live `stripe_subscription` row stay Pro.

**Server / data**
- New `pro_entitlements` table: `user_id`, `source`, `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`. RLS: user reads own; service_role writes.
- Server fn `createProCheckout({ plan: 'monthly'|'yearly' })` → returns hosted checkout URL.
- Server fn `openBillingPortal()` → returns Stripe billing portal URL.
- Webhook route `src/routes/api/public/hooks/stripe.ts` — verifies signature with `STRIPE_WEBHOOK_SECRET`, handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, writes `pro_entitlements`.
- Admin action `setUserPro({ userId, until })` for comps/founders, gated by `super_admin` role.
- Helper `useIsPro()` hook reads `profiles.is_pro` (server-trusted) and respects the global "free for everyone" flag in `platform_rules`.

**UI**
- `/pricing` keeps "Free. Forever." hero. Add a quieter "Purple Pro" section below: highest tier, single price, monthly/yearly toggle, "Currently free for everyone — Pro will arrive soon" badge while the global flag is on.
- Account → new "Billing" section: shows current plan, "Manage billing" button (Stripe portal) when subscribed.
- No feature gating wired yet — just the plumbing. We'll add gates per-feature later when you say so.

**What I need from you before enabling**
- Confirm enable Stripe Payments (test mode). I'll run `recommend_payment_provider` first to double-check fit, then `enable_stripe_payments`.
- Decide Pro pricing now or later (placeholder $9/mo, $79/yr if you don't say).

---

## 2. DNA upload — drag-and-drop + big/compressed files

**Current limits to remove**
- 30 MB cap, text-only formats, click-only file picker.

**Plan**
- **Drag-and-drop zone** wrapping the existing upload card. Visual highlight on dragenter, drop handler reuses `handleFile`. Keep "Choose file" button for click users.
- **Raise size cap to 500 MB**. Update the server validator (`MAX_BYTES`) and the client check. Uploads go straight to storage (already direct-to-bucket via `supabase.storage.upload`), so the Worker never streams the payload.
- **Accept more extensions**:
  - Text genotype files: `.txt`, `.tsv`, `.csv` (23andMe, Ancestry, MyHeritage)
  - VCF: `.vcf`, `.vcf.gz`
  - Compressed bundles: `.zip`, `.gz`, `.tar`, `.tar.gz`
  - JSON exports (e.g. Nebula, some clinical exports): `.json`
  - Index files (`.tbi`, `.crai`, `.bai`, `.csi`) — accepted but **flagged as index-only** with a note "We need the matching `.bam`/`.cram`/`.vcf` file too." We don't parse these alone.
  - BAM/CRAM (`.bam`, `.cram`) — accepted, queued, but parsing is **not supported** in v1; we store + show "Raw alignment files aren't parsed yet. Upload a 23andMe/Ancestry/VCF export for trait insights."
- **Decompression in the parser** (`src/lib/dna-parse.server.ts`):
  - `.gz` → `zlib.gunzip` (Node built-in, available in Worker runtime).
  - `.zip` → `fflate` (pure-JS, Worker-safe). Pick the first `.txt`/`.tsv`/`.vcf` inside.
  - `.tar` / `.tar.gz` → `nanotar` (pure-JS).
  - `.json` → new branch: detect 23andMe-style `{ rsid: genotype }` maps and Nebula-style arrays; map into the same curated allowlist.
- **Streaming text**: for files >50 MB, read with `blob.stream()` and parse line-by-line so we never hold the full text in memory.
- **Per-file status detail**: show parsed variant count, file size, format detected. Errors stay specific ("Couldn't read .bam — not supported yet").

**Files to edit**
- `src/routes/_app/my-health-dna.tsx` — drop zone, accept list, copy.
- `src/lib/dna.functions.ts` — raise `MAX_BYTES`, store detected `compression` and `kind`.
- `src/lib/dna-parse.server.ts` — decompression + streaming + JSON branch.
- Migration: `dna_files.compression text`, `dna_files.kind text` ('genotype'|'vcf'|'bam'|'cram'|'index'|'json'|'unknown').
- New deps: `fflate`, `nanotar` (both Worker-safe, pure JS).

---

## 3. What else is left

From the original Wave-1 list, after this turn the open threads are:

- **Stripe / Pro tier** — covered above. Plumbing only; no gates until you say.
- **DNA expansion** — covered above.
- **Condition onboarding nudge** — already shipped (`ConditionWelcomeNudge` on `/today`).
- **Friend social-tier UI** — already shipped (`/settings/sharing` toggle + `/friends/$id` view).

**Smaller follow-ups I haven't built yet** (call out so you can pick):
1. **"Supporter" cosmetic badge** for users on Pro — tiny purple dot next to name in community.
2. **Feature gates** behind `is_pro` (which features? candidates: unlimited AI chat tokens, advanced trend windows, DNA module itself, multi-trip travel). Needs your call per-feature.
3. **Admin global toggle** — admin page row to flip "Pro free for everyone" on/off. Needed before you can ever turn it off.
4. **Billing portal link in Account** — only useful once Stripe is live.
5. **Annual plan discount copy / comparison table** on `/pricing` — only useful once you decide pricing.

**Out of scope unless you ask**
- Recurring donations (Pro is the monetization path now).
- BAM/CRAM parsing (huge scope; needs server-side alignment tools).
- Migrating data from old per-feature flags into `is_pro`.

---

## Build order (after approval)

1. Stripe — `recommend_payment_provider` → `enable_stripe_payments` → product + webhook + entitlements table + Account billing section + pricing page Pro card with "Free for now" badge.
2. DNA — add deps, migration for new columns, expand parser, drop zone + accept list + size cap.
3. Wire admin toggle for the "free for everyone" flag so you can flip it later.
