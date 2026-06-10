## Why DNA isn't under Insights

Right now `/my-health-dna` lives nowhere in the sidebar — it's only reachable from the My Health page. It was originally filed under **My Body** conceptually (it's body data) but never given a nav slot. That's why you can't see it from Insights.

Two reasonable homes:
- **Insights** — DNA is read-only pattern data we surface back to the user. Fits with Reports.
- **My Body** — it's literally body data alongside Biometrics / Intake / Meds.

I'd put it under **Insights** as you suggested — it's interpretive (we tell you what variants mean), not raw logging. Reports + DNA are both "what does my data say about me?"

### Fix
Add to `src/components/layout/nav-items.ts`, Insights group:
```
{ to: "/reports", label: "Reports", icon: FileText },
{ to: "/my-health-dna", label: "DNA", icon: Dna },   // new
```
That's it — one line. The route already exists.

---

## What's left, ordered by impact

### Quick wins (today, ~30 min total)
1. **DNA nav slot** under Insights (above).
2. **DNA file row regression** — your old uploads still show `UNKNOWN · PARSED` because `kind` was never persisted on those rows. Either delete + re-upload (you already did some), or I can run a one-shot backfill that re-detects `kind` from the stored filename so old rows display the new `Stored · not parsed` label.
3. **Mobile bottom nav** doesn't include Insights' children. Decide: leave DNA desktop-only in nav, or add a discoverable entry on mobile too.

### Billing track — parked until you flip the free flag off
4. **Add the 5 Stripe test secrets** and run checkout end-to-end.
5. **Stripe customer portal link** on `/account` (cancel, change plan, update card).
6. **Webhook idempotency log** so retried Stripe events don't double-apply.
7. **Server-side Ask Purple 24h limit** (today it's client-side localStorage — fine while free, trivial to bypass once gated).
8. **Receipts/invoice list** in account.

### Product polish — separate threads, pick when ready
9. **Today** — anything specific bugging you? (greeting copy, card order, empty state, etc.)
10. **Care** — caregiver invite flow, read-only by default, "confirm to write" step.
11. **DNA depth** — right now we just match curated rsids against your variants. Could add: trait-by-trait "what this means for you" using the care profile, or wire findings into Ask Purple's system prompt so it knows about your CYP2D6 / MTHFR / etc. when answering.

---

## Proposed move

Do all three **Quick wins** in one small pass (DNA nav + kind backfill + decide mobile), then you pick the next thread. Sound good?
