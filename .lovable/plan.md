# Wrap Pro features + rebuild /pricing

Two scoped changes. Both safe to ship today: while `pro_free_for_everyone = true` (current default), every gate stays invisible and the pricing page shows the "free for everyone right now" banner. The moment you flip the admin toggle, paywalls activate and Upgrade buttons turn on — no redeploy.

## 1. Wrap the four Pro features with `<ProGate>`

### a. DNA upload — `src/routes/_app/my-health-dna.tsx`
Wrap the upload card (the dropzone block around line 146 in the file) with `<ProGate feature="dna">`. The "Your files" list below stays visible regardless, so any user who already uploaded before keeps reading their data — only new uploads gate. Copy: "DNA insights are a Pro feature."

### b. Ask Purple daily limit — `src/routes/_app/chat.tsx`
Add a free-tier message cap of **10 user messages per rolling 24h**, counted client-side from `messages` (sufficient since the thread persists per session; we're not building server-side enforcement in this pass — that comes when billing goes live). When `!isPro && userMessagesLast24h >= 10`, replace the composer with a small `<ProGate feature="ask_unlimited">` block. While `pro_free_for_everyone` is on, `isPro` is true for everyone and the limit never triggers.

### c. Report sharing & scheduling
Two surfaces:
- **`src/routes/_app/reports.$reportId.tsx`** — the Share button (line ~226 `openOrShare("share")`). Wrap with `<ProGate feature="report_sharing">` using inline fallback (a small disabled button + "Pro" chip rather than a full card, so the report page layout stays intact).
- **`src/lib/medical-report-schedules.functions.ts` callers** — find the schedule UI (likely on `reports.tsx` or a settings page) and wrap the "New schedule" CTA with `<ProGate feature="report_sharing">`. I'll grep for it during build.

### d. Caregiver seats beyond 1 — `src/routes/_app/settings.sharing.tsx`
Around line 157 (`<InviteCaregiverSheet … />`), compute `activeCaregiverCount` from `caregivers.data.relationships.filter(r => r.status === 'active').length`. When `!isPro && activeCaregiverCount >= 1`, render `<ProGate feature="caregiver_seats">` instead of the invite button. Existing caregivers remain fully functional — we only gate adding more.

### Copy already lives in `src/components/pro/pro-gate.tsx`
The four `COPY` entries (`dna`, `ask_unlimited`, `report_sharing`, `caregiver_seats`) are written. No new components needed beyond two small **inline fallback** variants for cases where a full card would break layout (report Share button, chat composer). I'll add an optional `variant="inline"` prop to `<ProGate>` that renders a compact pill + Upgrade link instead of the big card.

## 2. Rebuild `/pricing` as a real pricing page

Current `src/routes/pricing.tsx` is a "Free. Forever." marketing page. Replace its body (keep `MarketingHeader` + `SiteFooter` shell + reveal animations) with:

1. **Hero**: "Purple is free for everyone right now." Subtext explains the two tiers are in place for the future; today every signed-in user gets full Pro access.
2. **Banner** (only shown when `freeForEveryone === true`): small pill — "Free for everyone · no payment needed today." Reads `getMySubscription` via TanStack Query; falls back to "true" during SSR so the banner shows on the static prerender (good for SEO too).
3. **Two pricing cards**:
   - Free — $0 — Journal, basic Ask Purple (10/day), 1 caregiver, biometrics, reports.
   - Pro — $9.99/mo · $99/yr (save 17%) — DNA insights, unlimited Ask Purple, report sharing & scheduling, unlimited caregivers.
   - Monthly/Yearly toggle on the Pro card.
   - Primary CTA: signed-out → `/sign-up`, signed-in + free-for-everyone → "You're on Pro" (disabled), signed-in + billing live → calls `createCheckoutSession`.
4. **FAQ** (4–5 items, accordion-free, just `<details>` for zero JS): Is it really free right now? · What happens if you turn on paid plans? · Can I cancel anytime? · Do you sell my data? (No.) · What about the open-source / self-host story?
5. **SEO metadata**: update `head()` — title "Pricing · Purple", description mentions both tiers, JSON-LD switches from single `Offer` to `AggregateOffer` with both prices.

## Technical notes

- `<ProGate>` already reads `useIsPro()` which queries `getMySubscription`. `freeForEveryone: true` → `isPro: true` → children render. No new server work.
- Inline variant for `<ProGate>`: small Upgrade chip + tooltip-style message, used in chat composer and report-share button. Card variant stays the default for dropzones and primary CTAs.
- Pricing route stays public (no `_app` prefix) so it prerenders. `useIsPro()` is safe — during SSR it returns `loading: true`, which we treat as "show free-for-everyone banner" optimistically. The query refines on hydration.
- No DB changes. No new server functions. No new secrets needed.

## Files touched
- Edit: `src/components/pro/pro-gate.tsx` (add `variant="inline"`)
- Edit: `src/routes/_app/my-health-dna.tsx`
- Edit: `src/routes/_app/chat.tsx` (add 24h message counter + inline gate)
- Edit: `src/routes/_app/reports.$reportId.tsx`
- Edit: one schedules surface (TBD via grep — likely `reports.tsx`)
- Edit: `src/routes/_app/settings.sharing.tsx`
- Rewrite: `src/routes/pricing.tsx`

Out of scope for this pass: server-side message-count enforcement for Ask Purple, blocking existing 2nd+ caregivers (we only stop *new* invites), Stripe secrets — all queued for when you bring billing live.
